import { HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { AuthorizedState } from './authState/authorized-state';
import { ConfigurationProvider } from './config';
import { EventTypes } from './events';
import { EventsService } from './events/events.service';
import { FlowsDataService } from './flows/flows-data.service';
import { FlowsService } from './flows/flows.service';
import { CheckSessionService, SilentRenewService } from './iframe';
import { LoggerService } from './logging/logger.service';
import { StoragePersistanceService } from './storage';
import { UserService } from './userData/user-service';
import { UrlService } from './utils';
import { FlowHelper } from './utils/flowHelper/flow-helper.service';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { TokenValidationService } from './validation/token-validation.service';
import { ValidationResult } from './validation/validation-result';

@Injectable()
export class OidcSecurityService {
    private isModuleSetupInternal$ = new BehaviorSubject<boolean>(false);
    private stsCallbackInternal$ = new Subject<boolean>();

    get configuration() {
        return this.configurationProvider.configuration;
    }

    get userData$() {
        return this.userService.userData$;
    }

    get isAuthenticated$() {
        return this.authStateService.authorized$;
    }

    get checkSessionChanged$() {
        return this.checkSessionService.checkSessionChanged$;
    }

    get moduleSetup$() {
        return this.isModuleSetupInternal$.asObservable();
    }

    get stsCallback$() {
        return this.stsCallbackInternal$.asObservable();
    }

    constructor(
        private checkSessionService: CheckSessionService,
        private silentRenewService: SilentRenewService,
        private userService: UserService,
        private storagePersistanceService: StoragePersistanceService,
        private tokenValidationService: TokenValidationService,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService,
        private zone: NgZone,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly eventsService: EventsService,
        private readonly urlService: UrlService,
        private readonly authStateService: AuthStateService,
        private readonly flowHelper: FlowHelper,
        private readonly flowsDataService: FlowsDataService,
        private readonly flowsService: FlowsService,
        private readonly router: Router
    ) {}

    private runTokenValidationRunning = false;
    private scheduledHeartBeatInternal: any;

    // TODO MOVE TO SEPERATE SERVICE WITH INIT LOGIC
    private isModuleSetup = false;
    private boundSilentRenewEvent: any;

    checkAuth(): Observable<boolean> {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Please provide a configuration before setting up the module');
            return;
        }
        this.loggerService.logDebug('STS server: ' + this.configurationProvider.openIDConfiguration.stsServer);

        const isAuthenticated = this.authStateService.isAuthStorageTokenValid();
        // validate storage and @@set authorized@@ if true
        if (isAuthenticated) {
            this.authStateService.setAuthorizedAndFireEvent();
            this.userService.publishUserdataIfExists();

            this.startTokenValidationPeriodically();

            if (this.checkSessionService.isCheckSessionConfigured()) {
                this.checkSessionService.start();
            }

            if (this.silentRenewService.isSilentRenewConfigured()) {
                this.silentRenewService.getOrCreateIframe();
            }
        }

        this.loggerService.logDebug('checkAuth completed fire events, auth: ' + isAuthenticated);

        // TODO EXTRACT THIS IN SERVICE LATER
        this.eventsService.fireEvent(EventTypes.ModuleSetup, true);
        this.isModuleSetupInternal$.next(true);
        this.isModuleSetup = true;

        const isCallbackFromSts = this.urlService.isCallbackFromSts();
        if (isCallbackFromSts) {
            this.stsCallbackInternal$.next();
        }

        return of(isAuthenticated);
    }

    getToken(): string {
        return this.authStateService.getAccessToken();
    }

    getIdToken(): string {
        return this.authStateService.getIdToken();
    }

    getRefreshToken(): string {
        return this.authStateService.getRefreshToken();
    }

    getPayloadFromIdToken(encode = false): any {
        const token = this.getIdToken();
        return this.tokenHelperService.getPayloadFromToken(token, encode);
    }

    setState(state: string): void {
        this.flowsDataService.setAuthStateControl(state);
    }

    getState(): string {
        return this.flowsDataService.getAuthStateControl();
    }

    // Code Flow with PCKE or Implicit Flow
    authorize(urlHandler?: (url: string) => any) {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Well known endpoints must be loaded before user can login!');
            return;
        }

        if (!this.tokenValidationService.configValidateResponseType(this.configurationProvider.openIDConfiguration.responseType)) {
            // invalid response_type
            return;
        }

        this.flowsService.resetAuthorizationData();

        this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

        const url = this.urlService.getAuthorizeUrl();

        if (urlHandler) {
            urlHandler(url);
        } else {
            this.redirectTo(url);
        }
    }

    // Code Flow Callback
    authorizedCallbackWithCode(urlToCheck: string) {
        if (!this.isModuleSetup) {
            return throwError('module is not set up');
        }

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
    authorizedImplicitFlowCallback(hash?: string) {
        if (!this.isModuleSetup) {
            return throwError('module is not set up');
        }

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

    logoff(urlHandler?: (url: string) => any) {
        // /connect/endsession?id_token_hint=...&post_logout_redirect_uri=https://myapp.com
        this.loggerService.logDebug('BEGIN Authorize, no auth data');

        if (this.configurationProvider.wellKnownEndpoints) {
            this.flowsService.resetAuthorizationData();
            if (this.configurationProvider.wellKnownEndpoints.endSessionEndpoint) {
                const endSessionEndpoint = this.configurationProvider.wellKnownEndpoints.endSessionEndpoint;
                const idTokenHint = this.storagePersistanceService.idToken;
                const url = this.urlService.createEndSessionUrl(endSessionEndpoint, idTokenHint);

                if (this.checkSessionService.serverStateChanged()) {
                    this.loggerService.logDebug('only local login cleaned up, server session has changed');
                } else if (urlHandler) {
                    urlHandler(url);
                } else {
                    this.redirectTo(url);
                }
            } else {
                this.loggerService.logDebug('only local login cleaned up, no end_session_endpoint');
            }
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
    }

    getEndSessionUrl(): string | undefined {
        if (this.configurationProvider.wellKnownEndpoints) {
            if (this.configurationProvider.wellKnownEndpoints.endSessionEndpoint) {
                const endSessionEndpoint = this.configurationProvider.wellKnownEndpoints.endSessionEndpoint;
                const idTokenHint = this.storagePersistanceService.idToken;
                return this.urlService.createEndSessionUrl(endSessionEndpoint, idTokenHint);
            }
        }
    }

    doPeriodicallTokenCheck(): void {
        this.startTokenValidationPeriodically();
    }

    stopPeriodicallTokenCheck(): void {
        if (this.scheduledHeartBeatInternal) {
            clearTimeout(this.scheduledHeartBeatInternal);
            this.scheduledHeartBeatInternal = null;
            this.runTokenValidationRunning = false;
        }
    }

    private redirectTo(url: string) {
        window.location.href = url;
    }

    private startTokenValidationPeriodically() {
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
                'Checking:' +
                    `\tsilentRenewRunning: ${this.flowsDataService.isSilentRenewRunning()} ` +
                    `\tid_token: ${!!this.authStateService.getIdToken()} ` +
                    `\tuserData: ${!!this.userService.getUserDataFromStore()}`
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
                            this.refreshSessionWithRefreshTokens().subscribe();
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
