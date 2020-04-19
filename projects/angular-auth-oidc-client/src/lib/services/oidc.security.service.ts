import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { oneLineTrim } from 'common-tags';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config';
import { EventTypes } from '../events';
import { EventsService } from '../events/events.service';
import { CheckSessionService, SilentRenewService } from '../iframeServices';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';
import { UserService } from '../userData/user-service';
import { RandomService, UrlService } from '../utils';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { JwtKeys } from '../validation/jwtkeys';
import { StateValidationService } from '../validation/state-validation.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { ValidationResult } from '../validation/validation-result';
import { TokenHelperService } from './oidc-token-helper.service';

@Injectable()
export class OidcSecurityService {
    public get configuration() {
        return this.configurationProvider.configuration;
    }

    public get userData$() {
        return this.userService.userData$;
    }

    public get isAuthenticated$() {
        return this.authStateService.authorized$;
    }

    private runTokenValidationRunning = false;
    private scheduledHeartBeatInternal: any;

    // TODO MOVE TO SEPERATE SERVICE WITH INIT LOGIC
    private isModuleSetup = false;
    constructor(
        private oidcDataService: DataService,
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
        private readonly httpClient: HttpClient,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly eventsService: EventsService,
        private readonly urlService: UrlService,
        private readonly randomService: RandomService,
        private readonly authStateService: AuthStateService,
        private readonly flowHelper: FlowHelper
    ) {}

    // private checkSetupAndAuthorizedInternal() {
    //     this.isSetupAndAuthorizedInternal = this.isModuleSetupInternal.pipe(
    //         filter((isModuleSetup: boolean) => isModuleSetup),
    //         switchMap(() => {
    //             if (!this.configurationProvider.openIDConfiguration.silentRenew) {
    //                 this.loggerService.logDebug(`IsAuthorizedRace: Silent Renew Not Active. Emitting.`);
    //                 return from([true]);
    //             }
    //             const race$ = race(
    //                 this.isAuthorizedInternal.asObservable().pipe(
    //                     filter((isAuthorized: boolean) => isAuthorized),
    //                     take(1),
    //                     tap(() => this.loggerService.logDebug('IsAuthorizedRace: Existing token is still authorized.'))
    //                 ),
    //                 this.onAuthorizationResultInternal.pipe(
    //                     take(1),
    //                     tap(() => this.loggerService.logDebug('IsAuthorizedRace: Silent Renew Refresh Session Complete')),
    //                     map(() => true)
    //                 ),
    //                 timer(this.configurationProvider.openIDConfiguration.isauthorizedRaceTimeoutInSeconds * 1000).pipe(
    //                     // backup, if nothing happens after X seconds stop waiting and emit (5s Default)
    //                     tap(() => {
    //                         this.resetAuthorizationData(false);
    //                         this.storagePersistanceService.authNonce = '';
    //                         this.loggerService.logWarning('IsAuthorizedRace: Timeout reached. Emitting.');
    //                     }),
    //                     map(() => true)
    //                 )
    //             );
    //             this.loggerService.logDebug('Silent Renew is active, check if token in storage is active');
    //             if (this.storagePersistanceService.authNonce === '' || this.storagePersistanceService.authNonce === undefined) {
    //                 // login not running, or a second silent renew, user must login first before this will work.
    //                 this.loggerService.logDebug('Silent Renew or login not running, try to refresh the session');
    //                 this.refreshSession().subscribe();
    //             }
    //             return race$;
    //         }),
    //         tap(() => this.loggerService.logDebug('IsAuthorizedRace: Completed')),
    //         switchMapTo(this.isAuthorizedInternal.asObservable()),
    //         tap((isAuthorized: boolean) => this.loggerService.logDebug(`getIsAuthorized: ${isAuthorized}`)),
    //         shareReplay(1)
    //     );
    //     this.isSetupAndAuthorizedInternal
    //         .pipe(filter(() => this.configurationProvider.openIDConfiguration.startCheckSession))
    //         .subscribe((isSetupAndAuthorized) => {
    //             if (isSetupAndAuthorized) {
    //                 this.checkSessionService.start(this.configurationProvider.openIDConfiguration.clientId);
    //             } else {
    //                 this.checkSessionService.stop();
    //             }
    //         });
    // }

    checkAuth(): Observable<boolean> {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Please provide a configuration before setting up the module');
            return;
        }

        this.loggerService.logDebug('STS server: ' + this.configurationProvider.openIDConfiguration.stsServer);

        // validate storage and @@set authorized@@ if true
        this.authStateService.initStateFromStorage();

        if (!this.configurationProvider.openIDConfiguration.useRefreshToken) {
            // module setup (not refresh tokens)
            // init silent renew
            if (this.configurationProvider.openIDConfiguration.silentRenew) {
                this.silentRenewService.init();
                this.silentRenewService.silentRenewResult$.subscribe((detail) => {
                    this.silentRenewEventHandler(detail);
                });
            }
        }

        if (this.authStateService.isAuthStorageTokenValid()) {
            // startTokenValidationPeriodically()        (if authorized)
            this.startTokenValidationPeriodically();
        }

        this.eventsService.fireEvent(EventTypes.ModuleSetup, true);
        this.isModuleSetup = true;
        return this.authStateService.authorized$;
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
        this.storagePersistanceService.authStateControl = state;
    }

    getState(): string {
        return this.storagePersistanceService.authStateControl;
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

        this.resetAuthorizationData(false);

        this.loggerService.logDebug('BEGIN Authorize Code Flow, no auth data');

        let state = this.storagePersistanceService.authStateControl;
        if (!state) {
            state = this.randomService.createRandom(40);
            this.storagePersistanceService.authStateControl = state;
        }

        const nonce = this.randomService.createRandom(40);
        this.storagePersistanceService.authNonce = nonce;
        this.loggerService.logDebug('AuthorizedController created. local state: ' + this.storagePersistanceService.authStateControl);

        let url = '';
        // Code Flow
        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            // code_challenge with "S256"
            const codeVerifier = this.randomService.createRandom(67);
            const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

            this.storagePersistanceService.codeVerifier = codeVerifier;

            if (this.configurationProvider.wellKnownEndpoints) {
                url = this.urlService.createAuthorizeUrl(
                    codeChallenge,
                    this.configurationProvider.openIDConfiguration.redirectUrl,
                    nonce,
                    state
                );
            } else {
                this.loggerService.logError('authWellKnownEndpoints is undefined');
            }
        } else {
            // Implicit Flow

            if (this.configurationProvider.wellKnownEndpoints) {
                url = this.urlService.createAuthorizeUrl('', this.configurationProvider.openIDConfiguration.redirectUrl, nonce, state);
            } else {
                this.loggerService.logError('authWellKnownEndpoints is undefined');
            }
        }

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

        return this.httpClient.post(tokenRequestUrl, data, { headers }).pipe(
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

        if (!this.tokenValidationService.validateStateFromHashCallback(state, this.storagePersistanceService.authStateControl)) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            // ValidationResult.StatesDoNotMatch;
            return throwError(new Error('incorrect state'));
        }

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        let data = oneLineTrim`grant_type=authorization_code&client_id=${this.configurationProvider.openIDConfiguration.clientId}
            &code_verifier=${this.storagePersistanceService.codeVerifier}
            &code=${code}&redirect_uri=${this.configurationProvider.openIDConfiguration.redirectUrl}`;

        if (this.storagePersistanceService.silentRenewRunning === 'running') {
            data = oneLineTrim`grant_type=authorization_code&client_id=${this.configurationProvider.openIDConfiguration.clientId}
                &code_verifier=${this.storagePersistanceService.codeVerifier}
                &code=${code}
                &redirect_uri=${this.configurationProvider.openIDConfiguration.silentRenewUrl}`;
        }

        return this.httpClient.post(tokenRequestUrl, data, { headers }).pipe(
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
        const silentRenew = this.storagePersistanceService.silentRenewRunning;
        const isRenewProcess = silentRenew === 'running';

        this.loggerService.logDebug('BEGIN authorized Code Flow Callback, no auth data');
        this.resetAuthorizationData(isRenewProcess);
        this.authorizedCallbackProcedure(result, isRenewProcess);
    }

    // Implicit Flow
    private authorizedImplicitFlowCallbackProcedure(hash?: string) {
        const silentRenew = this.storagePersistanceService.silentRenewRunning;
        const isRenewProcess = silentRenew === 'running';

        this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
        this.resetAuthorizationData(isRenewProcess);

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

            this.resetAuthorizationData(false);
            this.storagePersistanceService.authNonce = '';

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
                        this.storagePersistanceService.silentRenewRunning = '';

                        if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
                            this.userService
                                .getAndPersistUserDataInStore(isRenewProcess, validationResult.idToken, validationResult.decodedIdToken)
                                .subscribe(
                                    (userData) => {
                                        if (!!userData) {
                                            this.storagePersistanceService.sessionState = result.session_state;
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
                                            this.resetAuthorizationData(false);

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
                        this.resetAuthorizationData(false);
                        this.storagePersistanceService.silentRenewRunning = '';

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
                    this.storagePersistanceService.silentRenewRunning = '';
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
            if (this.configurationProvider.wellKnownEndpoints.endSessionEndpoint) {
                const endSessionEndpoint = this.configurationProvider.wellKnownEndpoints.endSessionEndpoint;
                const idTokenHint = this.storagePersistanceService.idToken;
                const url = this.urlService.createEndSessionUrl(endSessionEndpoint, idTokenHint);

                this.resetAuthorizationData(false);

                if (this.checkSessionService.serverStateChanged()) {
                    this.loggerService.logDebug('only local login cleaned up, server session has changed');
                } else if (urlHandler) {
                    urlHandler(url);
                } else {
                    this.redirectTo(url);
                }
            } else {
                this.resetAuthorizationData(false);
                this.loggerService.logDebug('only local login cleaned up, no end_session_endpoint');
            }
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
    }

    // this is not an observable as return
    refreshSession(): Observable<boolean> {
        if (
            !this.configurationProvider.openIDConfiguration.silentRenewUrl ||
            this.configurationProvider.openIDConfiguration.useRefreshToken
        ) {
            return of(false);
        }

        this.loggerService.logDebug('BEGIN refresh session Authorize');
        this.storagePersistanceService.silentRenewRunning = 'running';

        let state = this.storagePersistanceService.authStateControl;
        if (state === '' || state === null) {
            state = this.randomService.createRandom(40);
            this.storagePersistanceService.authStateControl = state;
        }

        const nonce = this.randomService.createRandom(40);
        this.storagePersistanceService.authNonce = nonce;
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + this.storagePersistanceService.authStateControl);

        let url = '';

        // Code Flow
        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            if (this.configurationProvider.openIDConfiguration.useRefreshToken) {
                // try using refresh token
                const refreshToken = this.storagePersistanceService.getRefreshToken();
                if (refreshToken) {
                    this.loggerService.logDebug('found refresh code, obtaining new credentials with refresh code');
                    // Nonce is not used with refresh tokens; but Keycloak may send it anyway
                    this.storagePersistanceService.authNonce = TokenValidationService.RefreshTokenNoncePlaceholder;
                    return this.refreshTokensWithCodeProcedure(refreshToken, state);
                } else {
                    this.loggerService.logDebug('no refresh token found, using silent renew');
                }
            }
            // code_challenge with "S256"
            const codeVerifier = this.randomService.createRandom(67);
            const codeChallenge = this.tokenValidationService.generateCodeVerifier(codeVerifier);

            this.storagePersistanceService.codeVerifier = codeVerifier;

            if (this.configurationProvider.wellKnownEndpoints) {
                url = this.urlService.createAuthorizeUrl(
                    codeChallenge,
                    this.configurationProvider.openIDConfiguration.silentRenewUrl,
                    nonce,
                    state,
                    'none'
                );
            } else {
                this.loggerService.logWarning('authWellKnownEndpoints is undefined');
            }
        } else {
            if (this.configurationProvider.wellKnownEndpoints) {
                url = this.urlService.createAuthorizeUrl(
                    '',
                    this.configurationProvider.openIDConfiguration.silentRenewUrl,
                    nonce,
                    state,
                    'none'
                );
            } else {
                this.loggerService.logWarning('authWellKnownEndpoints is undefined');
            }
        }

        // PAY ATTENTION: IT RETURNS TRUE IF YOU ARE NOT AUTHORIZED AS WELL
        return this.authStateService.authorized$.pipe(
            switchMap((isAuthorized) => {
                if (isAuthorized) {
                    this.silentRenewService.sendAuthorizeReqestUsingSilentRenew(url);
                }
                return of(true);
            })
        );
    }

    handleError(error: any) {
        const silentRenew = this.storagePersistanceService.silentRenewRunning;
        const isRenewProcess = silentRenew === 'running';
        this.loggerService.logError(error);
        if (error.status === 403 || error.status === '403') {
            if (this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent) {
                this.authStateService.updateAndPublishAuthState({
                    authorizationState: AuthorizedState.Unauthorized,
                    validationResult: ValidationResult.NotSet,
                    isRenewProcess,
                });
            } else {
                this.router.navigate([this.configurationProvider.openIDConfiguration.forbiddenRoute]);
            }
        } else if (error.status === 401 || error.status === '401') {
            const silentRenewRunning = this.storagePersistanceService.silentRenewRunning;

            this.resetAuthorizationData(!!silentRenewRunning);

            if (this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent) {
                this.authStateService.updateAndPublishAuthState({
                    authorizationState: AuthorizedState.Unauthorized,
                    validationResult: ValidationResult.NotSet,
                    isRenewProcess,
                });
            } else {
                this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
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

    resetAuthorizationData(isRenewProcess: boolean): void {
        if (isRenewProcess) {
            // TODO ADD A LOG
            return;
        }

        if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
            // Clear user data. Fixes #97.
            this.userService.resetUserDataInStore();
        }

        this.storagePersistanceService.resetStorageFlowData();

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

            return this.oidcDataService
                .get<JwtKeys>(this.configurationProvider.wellKnownEndpoints.jwksUri || '')
                .pipe(catchError(this.handleErrorGetSigningKeys));
        } else {
            this.loggerService.logWarning('getSigningKeys: authWellKnownEndpoints is undefined');
        }

        return this.oidcDataService.get<JwtKeys>('undefined').pipe(catchError(this.handleErrorGetSigningKeys));
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

    // TODO MOVE THIS METHOD INTO CORRESPONDING SERVICE `validation/token.validation.service.ts`
    private startTokenValidationPeriodically() {
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
                    `\tsilentRenewRunning: ${this.storagePersistanceService.silentRenewRunning === 'running'}\r\n` +
                    `\tidToken: ${!!this.authStateService.getIdToken()}\r\n` +
                    `\tuserData: ${!!this.userService.getUserDataFromStore()}`
            );
            if (
                this.userService.getUserDataFromStore() &&
                this.storagePersistanceService.silentRenewRunning !== 'running' &&
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
                        this.resetAuthorizationData(false);
                    }
                }
            }

            /* Delay 3 seconds and do the next check */
            this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
        };

        this.zone.runOutsideAngular(() => {
            /* Initial heartbeat check */
            this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 10000);
        });
    }

    private resetBrowserHistory() {
        window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
    }

    private silentRenewEventHandler(detail: any) {
        console.warn('@@@@@@ silentRenewEventHandler event');
        if (!detail) {
            console.warn('@@@@@@ silentRenewEventHandler NO detail');
            return;
        }
        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            const urlParts = detail.toString().split('?');
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
                this.resetAuthorizationData(false);
                this.storagePersistanceService.authNonce = '';
                this.loggerService.logDebug(detail.toString());
            }
        } else {
            // ImplicitFlow
            this.authorizedImplicitFlowCallback(detail);
        }
    }
}
