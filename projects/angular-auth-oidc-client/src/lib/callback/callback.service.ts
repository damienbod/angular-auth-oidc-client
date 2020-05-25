import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, interval, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { UserService } from '../userData/user-service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check-service';

@Injectable({ providedIn: 'root' })
export class CallbackService {
    private boundSilentRenewEvent: any;
    private renderer: Renderer2;

    private stsCallbackInternal$ = new Subject();

    get stsCallback$() {
        return this.stsCallbackInternal$.asObservable();
    }

    constructor(
        private urlService: UrlService,
        private flowsService: FlowsService,
        private flowHelper: FlowHelper,
        private configurationProvider: ConfigurationProvider,
        private router: Router,
        private flowsDataService: FlowsDataService,
        private loggerService: LoggerService,
        private silentRenewService: SilentRenewService,
        private userService: UserService,
        private authStateService: AuthStateService,
        private authWellKnownService: AuthWellKnownService,
        private periodicallyTokenCheckService: PeriodicallyTokenCheckService,
        private implicitFlowCallbackService: ImplicitFlowCallbackService,
        private codeFlowCallbackService: CodeFlowCallbackService,
        rendererFactory: RendererFactory2
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    isCallback(): boolean {
        return this.urlService.isCallbackFromSts();
    }

    handleCallbackAndFireEvents(currentCallbackUrl: string) {
        let callback$: Observable<any>;

        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            callback$ = this.codeFlowCallbackService.authorizedCallbackWithCode(currentCallbackUrl);
        } else if (this.flowHelper.isCurrentFlowAnyImplicitFlow()) {
            callback$ = this.implicitFlowCallbackService.authorizedImplicitFlowCallback();
        }

        return callback$.pipe(tap(() => this.stsCallbackInternal$.next()));
    }

    startTokenValidationPeriodically(repeatAfterSeconds: number) {
        if (!!this.periodicallyTokenCheckService.runTokenValidationRunning || !this.configurationProvider.openIDConfiguration.silentRenew) {
            return;
        }

        const millisecondsDelayBetweenTokenCheck = repeatAfterSeconds * 1000;

        this.loggerService.logDebug(
            `starting token validation check every ${repeatAfterSeconds}s (${millisecondsDelayBetweenTokenCheck}ms)`
        );

        const periodicallyCheck$ = interval(millisecondsDelayBetweenTokenCheck).pipe(
            switchMap(() => {
                const idToken = this.authStateService.getIdToken();
                const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning();
                const userDataFromStore = this.userService.getUserDataFromStore();

                this.loggerService.logDebug(
                    `Checking: silentRenewRunning: ${isSilentRenewRunning} id_token: ${!!idToken} userData: ${!!userDataFromStore}`
                );

                const shouldBeExecuted = userDataFromStore && !isSilentRenewRunning && idToken;

                if (!shouldBeExecuted) {
                    return of(null);
                }

                const idTokenHasExpired = this.authStateService.hasIdTokenExpired();
                const accessTokenHasExpired = this.authStateService.hasAccessTokenExpiredIfExpiryExists();

                if (!idTokenHasExpired && !accessTokenHasExpired) {
                    return of(null);
                }

                this.loggerService.logDebug('IsAuthorized: id_token idTokenHasExpired, start silent renew if active');

                if (!this.configurationProvider.openIDConfiguration.silentRenew) {
                    this.flowsService.resetAuthorizationData();
                    return of(null);
                }

                this.flowsDataService.setSilentRenewRunning();

                if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
                    // Refresh Session using Refresh tokens
                    return this.refreshSessionWithRefreshTokens();
                }

                return this.refreshSessionWithIframe();
            })
        );

        this.periodicallyTokenCheckService.runTokenValidationRunning = periodicallyCheck$
            .pipe(
                catchError(() => {
                    this.flowsDataService.resetSilentRenewRunning();
                    return throwError('periodically check failed');
                })
            )
            .subscribe(() => {
                if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
                    this.flowsDataService.resetSilentRenewRunning();
                }
            });
    }

    forceRefreshSession() {
        if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
            return this.startRefreshSession().pipe(
                map(() => {
                    const isAuthenticated = this.authStateService.areAuthStorageTokensValid();
                    if (isAuthenticated) {
                        return {
                            idToken: this.authStateService.getIdToken(),
                            accessToken: this.authStateService.getAccessToken(),
                        };
                    }

                    return null;
                })
            );
        }

        return forkJoin({
            refreshSession: this.startRefreshSession(),
            callbackContext: this.silentRenewService.refreshSessionWithIFrameCompletedInternal$,
        }).pipe(
            map(({ callbackContext }) => {
                const isAuthenticated = this.authStateService.areAuthStorageTokensValid();
                if (isAuthenticated) {
                    return {
                        idToken: callbackContext?.authResult?.id_token,
                        accessToken: callbackContext?.authResult?.access_token,
                    };
                }

                return null;
            })
        );
    }

    private startRefreshSession() {
        const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning();
        this.loggerService.logDebug(`Checking: silentRenewRunning: ${isSilentRenewRunning}`);
        const shouldBeExecuted = !isSilentRenewRunning;

        if (!shouldBeExecuted) {
            return of(null);
        }

        const authWellknownEndpointAdress = this.configurationProvider.openIDConfiguration?.authWellknownEndpoint;

        if (!authWellknownEndpointAdress) {
            this.loggerService.logError('no authwellknownendpoint given!');
            return of(null);
        }

        return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointAdress).pipe(
            switchMap(() => {
                this.flowsDataService.setSilentRenewRunning();

                if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
                    // Refresh Session using Refresh tokens
                    return this.refreshSessionWithRefreshTokens();
                }

                return this.refreshSessionWithIframe();
            })
        );
    }

    private refreshSessionWithRefreshTokens() {
        this.loggerService.logDebug('BEGIN refresh session Authorize');

        return this.flowsService.processRefreshToken().pipe(
            catchError((error) => {
                this.periodicallyTokenCheckService.stopPeriodicallTokenCheck();
                this.flowsService.resetAuthorizationData();
                return throwError(error);
            })
        );
    }

    private refreshSessionWithIframe(): Observable<boolean> {
        this.loggerService.logDebug('BEGIN refresh session Authorize Iframe renew');
        const url = this.urlService.getRefreshSessionSilentRenewUrl();
        return this.sendAuthorizeReqestUsingSilentRenew(url);
    }

    private sendAuthorizeReqestUsingSilentRenew(url: string): Observable<boolean> {
        const sessionIframe = this.silentRenewService.getOrCreateIframe();
        this.initSilentRenewRequest();
        this.loggerService.logDebug('sendAuthorizeReqestUsingSilentRenew for URL:' + url);

        return new Observable((observer) => {
            const onLoadHandler = () => {
                sessionIframe.removeEventListener('load', onLoadHandler);
                this.loggerService.logDebug('removed event listener from IFrame');
                observer.next(true);
                observer.complete();
            };
            sessionIframe.addEventListener('load', onLoadHandler);
            sessionIframe.src = url;
        });
    }

    private initSilentRenewRequest() {
        const instanceId = Math.random();

        const initDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-init', (e: CustomEvent) => {
            if (e.detail !== instanceId) {
                initDestroyHandler();
                renewDestroyHandler();
            }
        });
        const renewDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-message', (e) =>
            this.silentRenewService.silentRenewEventHandler(e)
        );

        window.dispatchEvent(
            new CustomEvent('oidc-silent-renew-init', {
                detail: instanceId,
            })
        );
    }
}
