import { HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config/';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { CheckSessionService } from '../iframe/check-session.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { UserService } from '../userData/user-service';
import { UrlService } from '../utils';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ValidationResult } from '../validation/validation-result';

@Injectable({ providedIn: 'root' })
export class CallbackService {
    private runTokenValidationRunning = false;
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
        private checkSessionService: CheckSessionService,
        private silentRenewService: SilentRenewService,
        private userService: UserService,
        private zone: NgZone,
        private authStateService: AuthStateService
    ) {}

    handlePossibleStsCallback(currentCallbackUrl: string) {
        if (!this.urlService.isCallbackFromSts()) {
            return of(null).pipe(tap(() => this.stsCallbackInternal$.next()));
        }

        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            return this.authorizedCallbackWithCode(currentCallbackUrl).pipe(tap(() => this.stsCallbackInternal$.next()));
        }

        if (this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken()) {
            return this.authorizedImplicitFlowCallback().pipe(tap(() => this.stsCallbackInternal$.next()));
        }

        return of(null).pipe(tap(() => this.stsCallbackInternal$.next()));
    }

    // Code Flow Callback
    private authorizedCallbackWithCode(urlToCheck: string) {
        return this.flowsService.processCodeFlowCallback(urlToCheck).pipe(
            tap((callbackContext) => {
                this.startTokenValidationPeriodically();

                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                }
            }),
            catchError((error) => {
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
                this.startTokenValidationPeriodically();

                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                }
            }),
            catchError((error) => {
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent /* TODO && !this.isRenewProcess */) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                this.stopPeriodicallTokenCheck();
                return throwError(error);
            })
        );
    }

    refreshSessionWithIframe(): Observable<boolean> {
        this.loggerService.logDebug('BEGIN refresh session Authorize Iframe renew');
        this.flowsDataService.setSilentRenewRunning();
        const url = this.urlService.getRefreshSessionSilentRenewUrl();

        return this.sendAuthorizeReqestUsingSilentRenew(url);
    }

    refreshSessionWithRefreshTokens() {
        this.loggerService.logDebug('BEGIN refresh session Authorize');
        this.flowsDataService.setSilentRenewRunning();

        return this.flowsService.processRefreshToken().pipe(
            tap(() => {
                this.startTokenValidationPeriodically();
            }),
            catchError((error) => {
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent /* TODO && !this.isRenewProcess */) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                this.stopPeriodicallTokenCheck();
                return throwError(error);
            })
        );
    }

    stopPeriodicallTokenCheck(): void {
        if (this.scheduledHeartBeatInternal) {
            clearTimeout(this.scheduledHeartBeatInternal);
            this.scheduledHeartBeatInternal = null;
            this.runTokenValidationRunning = false;
        }
    }

    startTokenValidationPeriodically() {
        if (this.checkSessionService.isCheckSessionConfigured()) {
            this.checkSessionService.start();
        }
        if (this.runTokenValidationRunning || !this.configurationProvider.openIDConfiguration.silentRenew) {
            return;
        }

        this.runTokenValidationRunning = true;
        this.loggerService.logDebug('runTokenValidation silent-renew running');

        /**
         *   First time: delay 5 seconds to call silentRenewHeartBeatCheck
         *   Afterwards: Run this check in a 5 second interval only AFTER the previous operation ends.
         */
        const silentRenewHeartBeatCheck = () => {
            this.loggerService.logDebug(
                'Checking: ' +
                    `silentRenewRunning: ${this.flowsDataService.isSilentRenewRunning()} ` +
                    ` id_token: ${!!this.authStateService.getIdToken()} ` +
                    ` userData: ${!!this.userService.getUserDataFromStore()}`
            );
            if (
                this.userService.getUserDataFromStore() &&
                !this.flowsDataService.isSilentRenewRunning() &&
                this.authStateService.getIdToken()
            ) {
                if (this.authStateService.tokenIsExpired()) {
                    this.loggerService.logDebug('IsAuthorized: id_token isTokenExpired, start silent renew if active');

                    // TODO remove subscribe
                    if (this.configurationProvider.openIDConfiguration.silentRenew) {
                        if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
                            // Refresh Session using Refresh tokens
                            this.refreshSessionWithRefreshTokens().subscribe(
                                () => {
                                    this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                                },
                                (err: any) => {
                                    this.loggerService.logError('Error: ' + err);
                                    this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                                }
                            );
                        } else {
                            // Send Silent renew request in iframe
                            this.refreshSessionWithIframe().subscribe(
                                () => {
                                    this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                                },
                                (err: any) => {
                                    this.loggerService.logError('Error: ' + err);
                                    this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                                }
                            );
                        }

                        /* In this situation, we schedule a heartbeat check only when silentRenew is finished.
                        We don't want to schedule another check so we have to return here */
                        return;
                    } else {
                        this.flowsService.resetAuthorizationData();
                    }
                }
            }

            /* Delay 3 seconds and do the next check */
            this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
        };

        this.zone.runOutsideAngular(() => {
            /* Initial heartbeat check */
            this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 5000);
        });
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
            this.codeFlowCallbackSilentRenewIframe(urlParts).subscribe();
        } else {
            // Implicit Flow Callback silent renew iframe
            this.authorizedImplicitFlowCallback(e.detail).subscribe();
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
        };

        return this.flowsService.processSilentRenewCodeFlowCallback(callbackContext).pipe(
            tap(() => this.startTokenValidationPeriodically()),
            catchError((errorFromFlow) => {
                this.stopPeriodicallTokenCheck();
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
