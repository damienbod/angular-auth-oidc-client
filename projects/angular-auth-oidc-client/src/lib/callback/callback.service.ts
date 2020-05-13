import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { UserService } from '../userData/user-service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { ValidationResult } from '../validation/validation-result';

@Injectable({ providedIn: 'root' })
export class CallbackService {
    private runTokenValidationRunning: Subscription = null;
    private scheduledHeartBeatInternal: any;
    private boundSilentRenewEvent: any;

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
        private authStateService: AuthStateService
    ) {}

    handlePossibleStsCallback(currentCallbackUrl: string) {
        let callback$: Observable<any>;

        if (!this.urlService.isCallbackFromSts()) {
            callback$ = of(null);
        } else if (this.flowHelper.isCurrentFlowCodeFlow()) {
            callback$ = this.authorizedCallbackWithCode(currentCallbackUrl);
        } else if (this.flowHelper.isCurrentFlowAnyImplicitFlow()) {
            callback$ = this.authorizedImplicitFlowCallback();
        }

        return callback$.pipe(tap(() => this.stsCallbackInternal$.next()));
    }

    refreshSession() {
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

        this.flowsDataService.setSilentRenewRunning();

        if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
            // Refresh Session using Refresh tokens
            return this.refreshSessionWithRefreshTokens();
        }

        return this.refreshSessionWithIframe();
    }
    startTokenValidationPeriodically(repeatAfterSeconds: number) {
        if (!!this.runTokenValidationRunning || !this.configurationProvider.openIDConfiguration.silentRenew) {
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

        this.runTokenValidationRunning = periodicallyCheck$
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

    private stopPeriodicallTokenCheck(): void {
        if (this.scheduledHeartBeatInternal) {
            clearTimeout(this.scheduledHeartBeatInternal);
            this.scheduledHeartBeatInternal = null;
            this.runTokenValidationRunning.unsubscribe();
            this.runTokenValidationRunning = null;
        }
    }

    // Code Flow Callback
    private authorizedCallbackWithCode(urlToCheck: string) {
        return this.flowsService.processCodeFlowCallback(urlToCheck).pipe(
            tap((callbackContext) => {
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                }
            }),
            catchError((error) => {
                this.flowsDataService.resetSilentRenewRunning();
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent /* TODO && !this.isRenewProcess */) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                this.stopPeriodicallTokenCheck();
                return throwError(error);
            })
        );
    }

    // Implicit Flow Callback
    private authorizedImplicitFlowCallback(hash?: string) {
        return this.flowsService.processImplicitFlowCallback(hash).pipe(
            tap((callbackContext) => {
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                }
            }),
            catchError((error) => {
                this.flowsDataService.resetSilentRenewRunning();
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent /* TODO && !this.isRenewProcess */) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                this.stopPeriodicallTokenCheck();
                return throwError(error);
            })
        );
    }

    private refreshSessionWithIframe(): Observable<boolean> {
        this.loggerService.logDebug('BEGIN refresh session Authorize Iframe renew');
        const url = this.urlService.getRefreshSessionSilentRenewUrl();
        return this.sendAuthorizeReqestUsingSilentRenew(url);
    }

    private refreshSessionWithRefreshTokens() {
        this.loggerService.logDebug('BEGIN refresh session Authorize');

        return this.flowsService.processRefreshToken().pipe(
            catchError((error) => {
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent /* TODO && !this.isRenewProcess */) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                this.stopPeriodicallTokenCheck();
                this.flowsService.resetAuthorizationData();
                return throwError(error);
            })
        );
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

    private silentRenewEventHandler(e: CustomEvent) {
        this.loggerService.logDebug('silentRenewEventHandler');
        if (!e.detail) {
            return;
        }
        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            const urlParts = e.detail.toString().split('?');
            // Code Flow Callback silent renew iframe
            this.codeFlowCallbackSilentRenewIframe(urlParts).subscribe(
                () => {
                    this.flowsDataService.resetSilentRenewRunning();
                },
                (err: any) => {
                    this.loggerService.logError('Error: ' + err);
                    this.flowsDataService.resetSilentRenewRunning();
                }
            );
        } else {
            // Implicit Flow Callback silent renew iframe
            this.authorizedImplicitFlowCallback(e.detail).subscribe(
                () => {
                    this.flowsDataService.resetSilentRenewRunning();
                },
                (err: any) => {
                    this.loggerService.logError('Error: ' + err);
                    this.flowsDataService.resetSilentRenewRunning();
                }
            );
        }
    }

    private codeFlowCallbackSilentRenewIframe(urlParts) {
        const params = new HttpParams({
            fromString: urlParts[1],
        });

        const error = params.get('error');

        if (error) {
            this.authStateService.updateAndPublishAuthState({
                authorizationState: AuthorizedState.Unauthorized,
                validationResult: ValidationResult.LoginRequired,
                isRenewProcess: true,
            });
            this.flowsService.resetAuthorizationData();
            this.flowsDataService.setNonce('');
            this.stopPeriodicallTokenCheck();
            return throwError(error);
        }

        const code = params.get('code');
        const state = params.get('state');
        const sessionState = params.get('session_state');

        const callbackContext = {
            code,
            refreshToken: null,
            state,
            sessionState,
            authResult: null,
            isRenewProcess: false,
            jwtKeys: null,
            validationResult: null,
            existingIdToken: null,
        };

        return this.flowsService.processSilentRenewCodeFlowCallback(callbackContext).pipe(
            catchError((errorFromFlow) => {
                this.stopPeriodicallTokenCheck();
                this.flowsService.resetAuthorizationData();
                return throwError(errorFromFlow);
            })
        );
    }

    private initSilentRenewRequest() {
        const instanceId = Math.random();
        this.silentRenewService.getOrCreateIframe();
        // Support authorization via DOM events.
        // Deregister if OidcSecurityService.setupModule is called again by any instance.
        //      We only ever want the latest setup service to be reacting to this event.
        this.boundSilentRenewEvent = this.silentRenewEventHandler.bind(this);

        const boundSilentRenewInitEvent: any = ((e: CustomEvent) => {
            if (e.detail !== instanceId) {
                window.removeEventListener('oidc-silent-renew-message', this.boundSilentRenewEvent);
                window.removeEventListener('oidc-silent-renew-init', boundSilentRenewInitEvent);
            }
        }).bind(this);

        window.addEventListener('oidc-silent-renew-init', boundSilentRenewInitEvent, false);
        window.addEventListener('oidc-silent-renew-message', this.boundSilentRenewEvent, false);

        window.dispatchEvent(
            new CustomEvent('oidc-silent-renew-init', {
                detail: instanceId,
            })
        );
    }
}
