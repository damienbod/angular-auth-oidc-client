import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config';
import { EventTypes } from '../events';
import { EventsService } from '../events/events.service';
import { FlowsDataService } from '../flows/flows-data.service';
import { CheckSessionService, SilentRenewService } from '../iframe';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';
import { UserService } from '../userData/user-service';
import { UrlService } from '../utils';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { JwtKeys } from '../validation/jwtkeys';
import { StateValidationService } from '../validation/state-validation.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { ValidationResult } from '../validation/validation-result';
import { TokenHelperService } from './oidc-token-helper.service';

@Injectable()
export class OidcSecurityService {
    private isModuleSetupInternal$ = new BehaviorSubject<boolean>(false);

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

    constructor(
        private dataService: DataService,
        private stateValidationService: StateValidationService,
        private router: Router,
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
        private readonly flowsDataService: FlowsDataService
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

        this.resetAuthorizationData();

        this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

        const url = this.urlService.getAuthorizeUrl();

        if (urlHandler) {
            urlHandler(url);
        } else {
            this.redirectTo(url);
        }
    }

    // Code Flow
    authorizedCallbackWithCode(urlToCheck: string) {
        this.authorizedCallbackWithCode$(urlToCheck).subscribe();
    }
    authorizedCallbackWithCode$(urlToCheck: string): Observable<void> {
        const code = this.urlService.getUrlParameter(urlToCheck, 'code');
        const state = this.urlService.getUrlParameter(urlToCheck, 'state');
        const sessionState = this.urlService.getUrlParameter(urlToCheck, 'session_state') || null;

        if (!state) {
            this.loggerService.logDebug('no state in url');
            return of();
        }
        if (!code) {
            this.loggerService.logDebug('no code in url');
            return of();
        }
        this.loggerService.logDebug('running validation for callback' + urlToCheck);
        return this.requestTokensWithCode$(code, state, sessionState);
    }

    // TODO CLEAN THIS UP AS WELL
    requestTokensWithCode$(code: string, state: string, sessionState: string) {
        if (!this.isModuleSetup) {
            return;
        }

        return this.requestTokensWithCodeProcedure$(code, state, sessionState);
    }

    // Refresh Token
    refreshTokensWithCodeProcedure(code: string, state: string): Observable<any> {
        let tokenRequestUrl = '';
        if (this.configurationProvider.wellKnownEndpoints && this.configurationProvider.wellKnownEndpoints.tokenEndpoint) {
            tokenRequestUrl = `${this.configurationProvider.wellKnownEndpoints.tokenEndpoint}`;
        }

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        const data = `grant_type=refresh_token&client_id=${this.configurationProvider.openIDConfiguration.clientId}&refresh_token=${code}`;

        return this.dataService.post(tokenRequestUrl, data, headers).pipe(
            map((response) => {
                this.loggerService.logDebug('token refresh response: ' + JSON.stringify(response));
                let obj: any = new Object();
                obj = response;
                obj.state = state;

                this.authorizedCodeFlowCallbackProcedure(obj);
            }),
            catchError((error) => {
                this.loggerService.logError(error);
                this.loggerService.logError(`OidcService code request ${this.configurationProvider.openIDConfiguration.stsServer}`);
                return of(false);
            })
        );
    }

    requestTokensWithCodeProcedure(code: string, state: string, sessionState: string | null): void {
        this.requestTokensWithCodeProcedure$(code, state, sessionState).subscribe();
    }

    // Code Flow with PCKE
    requestTokensWithCodeProcedure$(code: string, state: string, sessionState: string | null): Observable<void> {
        let tokenRequestUrl = '';
        if (this.configurationProvider.wellKnownEndpoints && this.configurationProvider.wellKnownEndpoints.tokenEndpoint) {
            tokenRequestUrl = `${this.configurationProvider.wellKnownEndpoints.tokenEndpoint}`;
        }

        if (!this.tokenValidationService.validateStateFromHashCallback(state, this.flowsDataService.getAuthStateControl())) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            // ValidationResult.StatesDoNotMatch;
            return throwError(new Error('incorrect state'));
        }

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        const bodyForCodeFlow = this.urlService.createBodyForCodeFlowCodeRequest(code);

        return this.dataService.post(tokenRequestUrl, bodyForCodeFlow, headers).pipe(
            map((response) => {
                let obj: any = new Object();
                obj = response;
                obj.state = state;
                obj.session_state = sessionState;

                this.authorizedCodeFlowCallbackProcedure(obj);

                return undefined;
            }),
            catchError((error) => {
                this.loggerService.logError(error);
                this.loggerService.logError(`OidcService code request ${this.configurationProvider.openIDConfiguration.stsServer}`);
                return throwError(error);
            })
        );
    }

    // Code Flow
    private authorizedCodeFlowCallbackProcedure(result: any) {
        const isRenewProcess = this.flowsDataService.isSilentRenewRunning();

        this.loggerService.logDebug('BEGIN authorized Code Flow Callback, no auth data');
        if (!isRenewProcess) {
            this.resetAuthorizationData();
        }
        this.authorizedCallbackProcedure(result, isRenewProcess);
    }

    // Implicit Flow
    private authorizedImplicitFlowCallbackProcedure(hash?: string) {
        const isRenewProcess = this.flowsDataService.isSilentRenewRunning();

        this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
        if (!isRenewProcess) {
            this.resetAuthorizationData();
        }

        hash = hash || window.location.hash.substr(1);

        const result: any = hash.split('&').reduce((resultData: any, item: string) => {
            const parts = item.split('=');
            resultData[parts.shift() as string] = parts.join('=');
            return resultData;
        }, {});

        this.authorizedCallbackProcedure(result, isRenewProcess);
    }

    // Implicit Flow
    authorizedImplicitFlowCallback(hash?: string) {
        if (!this.isModuleSetup) {
            return;
        }

        this.authorizedImplicitFlowCallbackProcedure(hash);
    }

    private redirectTo(url: string) {
        window.location.href = url;
    }

    private authorizedCallbackProcedure(result: any, isRenewProcess: boolean) {
        this.authStateService.setAuthResultInStorage(result);

        if (this.historyCleanUpTurnedOn() && !isRenewProcess) {
            this.resetBrowserHistory();
        } else {
            this.loggerService.logDebug('history clean up inactive');
        }

        if (result.error) {
            this.loggerService.logDebug(`authorizedCallbackProcedure came with error`, result.error);

            if ((result.error as string) === 'login_required') {
                this.authStateService.updateAndPublishAuthState({
                    authorizationState: AuthorizedState.Unauthorized,
                    validationResult: ValidationResult.LoginRequired,
                    isRenewProcess,
                });
            } else {
                this.authStateService.updateAndPublishAuthState({
                    authorizationState: AuthorizedState.Unauthorized,
                    validationResult: ValidationResult.SecureTokenServerError,
                    isRenewProcess,
                });
            }

            this.resetAuthorizationData();
            this.flowsDataService.setNonce('');

            if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
                this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
            }
        } else {
            this.loggerService.logDebug(result);

            this.loggerService.logDebug('authorizedCallback created, begin token validation');

            this.getSigningKeys().subscribe(
                (jwtKeys) => {
                    const validationResult = this.stateValidationService.getValidatedStateResult(result, jwtKeys);

                    if (validationResult.authResponseIsValid) {
                        this.authStateService.setAuthorizationData(validationResult.accessToken, validationResult.idToken);
                        this.flowsDataService.resetSilentRenewRunning();

                        if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
                            this.userService
                                .getAndPersistUserDataInStore(isRenewProcess, validationResult.idToken, validationResult.decodedIdToken)
                                .subscribe(
                                    (userData) => {
                                        if (!!userData) {
                                            this.flowsDataService.setSessionState(result.session_state);
                                            this.startTokenValidationPeriodically();

                                            this.authStateService.updateAndPublishAuthState({
                                                authorizationState: AuthorizedState.Authorized,
                                                validationResult: validationResult.state,
                                                isRenewProcess,
                                            });

                                            if (
                                                !this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent &&
                                                !isRenewProcess
                                            ) {
                                                this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                                            }
                                        } else {
                                            this.resetAuthorizationData();

                                            this.authStateService.updateAndPublishAuthState({
                                                authorizationState: AuthorizedState.Unauthorized,
                                                validationResult: validationResult.state,
                                                isRenewProcess,
                                            });

                                            if (
                                                !this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent &&
                                                !isRenewProcess
                                            ) {
                                                this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                                            }
                                        }
                                    },
                                    (err) => {
                                        /* Something went wrong while getting signing key */
                                        this.loggerService.logWarning('Failed to retreive user info with error: ' + JSON.stringify(err));
                                    }
                                );
                        } else {
                            if (!isRenewProcess) {
                                // userData is set to the id_token decoded, auto get user data set to false
                                this.userService.setUserDataToStore(validationResult.decodedIdToken);
                            }

                            this.startTokenValidationPeriodically();

                            this.authStateService.updateAndPublishAuthState({
                                authorizationState: AuthorizedState.Authorized,
                                validationResult: validationResult.state,
                                isRenewProcess,
                            });
                            if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
                                this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                            }
                        }
                    } else {
                        // something went wrong
                        this.loggerService.logWarning('authorizedCallback, token(s) validation failed, resetting');
                        this.loggerService.logWarning(window.location.hash);
                        this.resetAuthorizationData();
                        this.flowsDataService.resetSilentRenewRunning();

                        this.authStateService.updateAndPublishAuthState({
                            authorizationState: AuthorizedState.Unauthorized,
                            validationResult: validationResult.state,
                            isRenewProcess,
                        });

                        if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
                            this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                        }
                    }
                },
                (err) => {
                    /* Something went wrong while getting signing key */
                    this.loggerService.logWarning('Failed to retreive siging key with error: ' + JSON.stringify(err));
                    this.flowsDataService.resetSilentRenewRunning();
                }
            );
        }
    }

    private historyCleanUpTurnedOn() {
        return !this.configurationProvider.openIDConfiguration.historyCleanupOff;
    }

    logoff(urlHandler?: (url: string) => any) {
        // /connect/endsession?id_token_hint=...&post_logout_redirect_uri=https://myapp.com
        this.loggerService.logDebug('BEGIN Authorize, no auth data');

        if (this.configurationProvider.wellKnownEndpoints) {
            this.resetAuthorizationData();
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

    // this is not an observable as return
    refreshSession(): Observable<boolean> {
        this.loggerService.logDebug('BEGIN refresh session Authorize');
        this.flowsDataService.setSilentRenewRunning();

        // Code Flow renew with Refresh tokens
        if (this.flowHelper.isCurrentFlowCodeFlow() && this.configurationProvider.openIDConfiguration.useRefreshToken) {
            return this.refreshSessionWithRefreshTokens();
        }

        const url = this.urlService.getRefreshSessionSilentRenewUrl();

        return this.sendAuthorizeReqestUsingSilentRenew$(url);
    }

    private refreshSessionWithRefreshTokens() {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);
        const refreshToken = this.authStateService.getRefreshToken();
        if (refreshToken) {
            this.loggerService.logDebug('found refresh code, obtaining new credentials with refresh code');
            // Nonce is not used with refresh tokens; but Keycloak may send it anyway
            this.flowsDataService.setNonce(TokenValidationService.RefreshTokenNoncePlaceholder);
            return this.refreshTokensWithCodeProcedure(refreshToken, state);
        } else {
            this.loggerService.logError('no refresh token found, please login');
            return;
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

    resetAuthorizationData(): void {
        if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
            // Clear user data. Fixes #97.
            this.userService.resetUserDataInStore();
        }

        this.flowsDataService.resetStorageFlowData();
        this.authStateService.setUnauthorizedAndFireEvent();
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

    // TODO EXTRACT IN SERVICE
    private getSigningKeys(): Observable<JwtKeys> {
        if (this.configurationProvider.wellKnownEndpoints) {
            this.loggerService.logDebug('jwks_uri: ' + this.configurationProvider.wellKnownEndpoints.jwksUri);

            return this.dataService
                .get<JwtKeys>(this.configurationProvider.wellKnownEndpoints.jwksUri || '')
                .pipe(catchError(this.handleErrorGetSigningKeys));
        } else {
            this.loggerService.logWarning('getSigningKeys: authWellKnownEndpoints is undefined');
        }

        return this.dataService.get<JwtKeys>('undefined').pipe(catchError(this.handleErrorGetSigningKeys));
    }

    private handleErrorGetSigningKeys(error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || {};
            const err = JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        this.loggerService.logError(errMsg);
        return throwError(errMsg);
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
         *   First time: delay 10 seconds to call silentRenewHeartBeatCheck
         *   Afterwards: Run this check in a 5 second interval only AFTER the previous operation ends.
         */
        const silentRenewHeartBeatCheck = () => {
            this.loggerService.logDebug(
                'silentRenewHeartBeatCheck\r\n' +
                    `\tsilentRenewRunning: ${this.flowsDataService.isSilentRenewRunning()} ` +
                    `\tidToken: ${!!this.authStateService.getIdToken()} ` +
                    `\tuserData: ${!!this.userService.getUserDataFromStore()}`
            );
            if (
                this.userService.getUserDataFromStore() &&
                !this.flowsDataService.isSilentRenewRunning() &&
                this.authStateService.getIdToken()
            ) {
                if (
                    this.tokenValidationService.isTokenExpired(
                        this.storagePersistanceService.idToken,
                        this.configurationProvider.openIDConfiguration.silentRenewOffsetInSeconds
                    )
                ) {
                    this.loggerService.logDebug('IsAuthorized: id_token isTokenExpired, start silent renew if active');

                    if (this.configurationProvider.openIDConfiguration.silentRenew) {
                        this.refreshSession().subscribe(
                            () => {
                                this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                            },
                            (err: any) => {
                                this.loggerService.logError('Error: ' + err);
                                this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                            }
                        );
                        /* In this situation, we schedule a heartbeat check only when silentRenew is finished.
                        We don't want to schedule another check so we have to return here */
                        return;
                    } else {
                        this.resetAuthorizationData();
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

    private resetBrowserHistory() {
        window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
    }

    private sendAuthorizeReqestUsingSilentRenew$(url: string): Observable<boolean> {
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
            const params = new HttpParams({
                fromString: urlParts[1],
            });
            const code = params.get('code');
            const state = params.get('state');
            const sessionState = params.get('session_state');
            const error = params.get('error');
            if (code && state) {
                this.requestTokensWithCodeProcedure(code, state, sessionState);
            }
            if (error) {
                this.authStateService.updateAndPublishAuthState({
                    authorizationState: AuthorizedState.Unauthorized,
                    validationResult: ValidationResult.LoginRequired,
                    isRenewProcess: true,
                });
                this.resetAuthorizationData();
                this.flowsDataService.setNonce('');
                this.loggerService.logDebug(e.detail.toString());
            }
        } else {
            // ImplicitFlow
            this.authorizedImplicitFlowCallback(e.detail);
        }
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
