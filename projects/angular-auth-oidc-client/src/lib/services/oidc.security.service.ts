import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { oneLineTrim } from 'common-tags';
import { BehaviorSubject, from, Observable, of, race, Subject, throwError, timer } from 'rxjs';
import { catchError, filter, first, map, shareReplay, switchMap, switchMapTo, take, tap } from 'rxjs/operators';
import { OidcDataService } from '../api/oidc-data.service';
import { CheckSessionService } from '../check-session/check-session.service';
import { ConfigurationProvider } from '../config';
import { EventTypes } from '../events';
import { EventsService } from '../events/events.service';
import { LoggerService } from '../logging/logger.service';
import { AuthorizationResult } from '../models/authorization-result';
import { AuthorizationState } from '../models/authorization-state.enum';
import { StoragePersistanceService } from '../storage';
import { UrlService } from '../utils';
import { JwtKeys } from '../validation/jwtkeys';
import { StateValidationService } from '../validation/state-validation.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { ValidationResult } from '../validation/validation-result';
import { TokenHelperService } from './oidc-token-helper.service';
import { OidcSecuritySilentRenew } from './oidc.security.silent-renew';
import { OidcSecurityUserService } from './oidc.security.user-service';

@Injectable()
export class OidcSecurityService {
    private onModuleSetupInternal = new Subject<boolean>();
    private onAuthorizationResultInternal = new Subject<AuthorizationResult>();

    public get onModuleSetup(): Observable<boolean> {
        return this.onModuleSetupInternal.asObservable();
    }

    public get onAuthorizationResult(): Observable<AuthorizationResult> {
        return this.onAuthorizationResultInternal.asObservable();
    }

    moduleSetup = false;

    private isModuleSetupInternal = new BehaviorSubject<boolean>(false);

    private isAuthorizedInternal = new BehaviorSubject<boolean>(false);
    private isSetupAndAuthorizedInternal: Observable<boolean>;

    private userDataInternal = new BehaviorSubject<any>('');
    private authWellKnownEndpointsLoaded = false;
    private runTokenValidationRunning = false;
    private scheduledHeartBeatInternal: any;
    private boundSilentRenewEvent: any;

    constructor(
        private oidcDataService: OidcDataService,
        private stateValidationService: StateValidationService,
        private router: Router,
        private checkSessionService: CheckSessionService,
        private oidcSecuritySilentRenew: OidcSecuritySilentRenew,
        private oidcSecurityUserService: OidcSecurityUserService,
        private storagePersistanceService: StoragePersistanceService,
        private tokenValidationService: TokenValidationService,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService,
        private zone: NgZone,
        private readonly httpClient: HttpClient,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly eventsService: EventsService,
        private readonly urlService: UrlService
    ) {
        this.onModuleSetup.pipe(take(1)).subscribe(() => {
            this.moduleSetup = true;
            this.isModuleSetupInternal.next(true);
        });

        this.checkSetupAndAuthorizedInternal();
    }

    private checkSetupAndAuthorizedInternal() {
        this.isSetupAndAuthorizedInternal = this.isModuleSetupInternal.pipe(
            filter((isModuleSetup: boolean) => isModuleSetup),
            switchMap(() => {
                if (!this.configurationProvider.openIDConfiguration.silentRenew) {
                    this.loggerService.logDebug(`IsAuthorizedRace: Silent Renew Not Active. Emitting.`);
                    return from([true]);
                }
                const race$ = race(
                    this.isAuthorizedInternal.asObservable().pipe(
                        filter((isAuthorized: boolean) => isAuthorized),
                        take(1),
                        tap(() => this.loggerService.logDebug('IsAuthorizedRace: Existing token is still authorized.'))
                    ),
                    this.onAuthorizationResultInternal.pipe(
                        take(1),
                        tap(() => this.loggerService.logDebug('IsAuthorizedRace: Silent Renew Refresh Session Complete')),
                        map(() => true)
                    ),
                    timer(this.configurationProvider.openIDConfiguration.isauthorizedRaceTimeoutInSeconds * 1000).pipe(
                        // backup, if nothing happens after X seconds stop waiting and emit (5s Default)
                        tap(() => {
                            this.resetAuthorizationData(false);
                            this.storagePersistanceService.authNonce = '';
                            this.loggerService.logWarning('IsAuthorizedRace: Timeout reached. Emitting.');
                        }),
                        map(() => true)
                    )
                );
                this.loggerService.logDebug('Silent Renew is active, check if token in storage is active');
                if (this.storagePersistanceService.authNonce === '' || this.storagePersistanceService.authNonce === undefined) {
                    // login not running, or a second silent renew, user must login first before this will work.
                    this.loggerService.logDebug('Silent Renew or login not running, try to refresh the session');
                    this.refreshSession().subscribe();
                }
                return race$;
            }),
            tap(() => this.loggerService.logDebug('IsAuthorizedRace: Completed')),
            switchMapTo(this.isAuthorizedInternal.asObservable()),
            tap((isAuthorized: boolean) => this.loggerService.logDebug(`getIsAuthorized: ${isAuthorized}`)),
            shareReplay(1)
        );
        this.isSetupAndAuthorizedInternal
            .pipe(filter(() => this.configurationProvider.openIDConfiguration.startCheckSession))
            .subscribe((isSetupAndAuthorized) => {
                if (isSetupAndAuthorized) {
                    this.checkSessionService.start(this.configurationProvider.openIDConfiguration.clientId);
                } else {
                    this.checkSessionService.stop();
                }
            });
    }

    setupModule(): void {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Please provide a configuration before setting up the module');
            return;
        }

        const userData = this.storagePersistanceService.userData;
        if (userData) {
            this.setUserData(userData);
        }

        const isAuthorized = this.storagePersistanceService.isAuthorized;
        if (isAuthorized) {
            this.loggerService.logDebug('IsAuthorized setup module');
            this.loggerService.logDebug(this.storagePersistanceService.idToken);
            if (
                this.tokenValidationService.isTokenExpired(
                    this.storagePersistanceService.idToken || this.storagePersistanceService.accessToken,
                    this.configurationProvider.openIDConfiguration.silentRenewOffsetInSeconds
                )
            ) {
                this.loggerService.logDebug('IsAuthorized setup module; id_token isTokenExpired');
            } else {
                this.loggerService.logDebug('IsAuthorized setup module; id_token is valid');
                this.setIsAuthorized(isAuthorized);
            }
            this.runTokenValidation();
        }

        this.loggerService.logDebug('STS server: ' + this.configurationProvider.openIDConfiguration.stsServer);

        this.onModuleSetupInternal.next();

        if (this.configurationProvider.openIDConfiguration.silentRenew) {
            this.oidcSecuritySilentRenew.initRenew();

            // Support authorization via DOM events.
            // Deregister if OidcSecurityService.setupModule is called again by any instance.
            //      We only ever want the latest setup service to be reacting to this event.
            this.boundSilentRenewEvent = this.silentRenewEventHandler.bind(this);

            const instanceId = Math.random();

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
        this.moduleSetup = true;
        this.eventsService.fireEvent(EventTypes.ModuleSetup, true);

        this.checkSetupAndAuthorizedInternal();
    }

    getUserData<T = any>(): Observable<T> {
        return this.userDataInternal.asObservable();
    }

    getIsModuleSetup(): Observable<boolean> {
        return this.isModuleSetupInternal.asObservable();
    }

    getIsAuthorized(): Observable<boolean> {
        return this.isSetupAndAuthorizedInternal;
    }

    getToken(): string {
        if (!this.isAuthorizedInternal.getValue()) {
            return '';
        }

        const token = this.storagePersistanceService.getAccessToken();
        return decodeURIComponent(token);
    }

    getIdToken(): string {
        if (!this.isAuthorizedInternal.getValue()) {
            return '';
        }

        const token = this.storagePersistanceService.getIdToken();
        return decodeURIComponent(token);
    }

    getRefreshToken(): string {
        if (!this.isAuthorizedInternal.getValue()) {
            return '';
        }

        const token = this.storagePersistanceService.getRefreshToken();
        return decodeURIComponent(token);
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
        if (this.configurationProvider.wellKnownEndpoints) {
            this.authWellKnownEndpointsLoaded = true;
        }

        if (!this.authWellKnownEndpointsLoaded) {
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
            state = this.createRandom(40);
            this.storagePersistanceService.authStateControl = state;
        }

        const nonce = this.createRandom(40);
        this.storagePersistanceService.authNonce = nonce;
        this.loggerService.logDebug('AuthorizedController created. local state: ' + this.storagePersistanceService.authStateControl);

        let url = '';
        // Code Flow
        if (this.configurationProvider.openIDConfiguration.responseType === 'code') {
            // code_challenge with "S256"
            const codeVerifier = this.createRandom(67);
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

    // Code Flow
    requestTokensWithCode(code: string, state: string, sessionState: string | null): void {
        this.requestTokensWithCode$(code, state, sessionState).subscribe();
    }

    requestTokensWithCode$(code: string, state: string, sessionState: string | null): Observable<void> {
        return this.isModuleSetupInternal.pipe(
            filter((isModuleSetup) => !!isModuleSetup),
            take(1),
            switchMap(() => {
                return this.requestTokensWithCodeProcedure$(code, state, sessionState);
            })
        );
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
        this.isModuleSetupInternal
            .pipe(
                filter((isModuleSetup: boolean) => isModuleSetup),
                take(1)
            )
            .subscribe(() => {
                this.authorizedImplicitFlowCallbackProcedure(hash);
            });
    }

    private redirectTo(url: string) {
        window.location.href = url;
    }

    // Implicit Flow
    private authorizedCallbackProcedure(result: any, isRenewProcess: boolean) {
        this.storagePersistanceService.authResult = result;

        if (!this.configurationProvider.openIDConfiguration.historyCleanupOff && !isRenewProcess) {
            // reset the history to remove the tokens
            window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
        } else {
            this.loggerService.logDebug('history clean up inactive');
        }

        if (result.error) {
            if (isRenewProcess) {
                this.loggerService.logDebug(result);
            } else {
                this.loggerService.logWarning(result);
            }

            if ((result.error as string) === 'login_required') {
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.LoginRequired, isRenewProcess)
                );
            } else {
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.SecureTokenServerError, isRenewProcess)
                );
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
                        this.setAuthorizationData(validationResult.accessToken, validationResult.idToken);
                        this.storagePersistanceService.silentRenewRunning = '';

                        if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
                            this.getUserinfo(isRenewProcess, result, validationResult.idToken, validationResult.decodedIdToken).subscribe(
                                (response) => {
                                    if (response) {
                                        this.onAuthorizationResultInternal.next(
                                            new AuthorizationResult(AuthorizationState.authorized, validationResult.state, isRenewProcess)
                                        );
                                        if (
                                            !this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent &&
                                            !isRenewProcess
                                        ) {
                                            this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                                        }
                                    } else {
                                        this.onAuthorizationResultInternal.next(
                                            new AuthorizationResult(AuthorizationState.unauthorized, validationResult.state, isRenewProcess)
                                        );
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
                                this.oidcSecurityUserService.setUserData(validationResult.decodedIdToken);
                                this.setUserData(this.oidcSecurityUserService.getUserData());
                            }

                            this.runTokenValidation();

                            this.onAuthorizationResultInternal.next(
                                new AuthorizationResult(AuthorizationState.authorized, validationResult.state, isRenewProcess)
                            );
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

                        this.onAuthorizationResultInternal.next(
                            new AuthorizationResult(AuthorizationState.unauthorized, validationResult.state, isRenewProcess)
                        );
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

    getUserinfo(isRenewProcess = false, result?: any, idToken?: any, decodedIdToken?: any): Observable<boolean> {
        result = result ? result : this.storagePersistanceService.authResult;
        idToken = idToken ? idToken : this.storagePersistanceService.idToken;
        decodedIdToken = decodedIdToken ? decodedIdToken : this.tokenHelperService.getPayloadFromToken(idToken, false);

        return new Observable<boolean>((observer) => {
            // flow id_token token
            if (
                this.configurationProvider.openIDConfiguration.responseType === 'id_token token' ||
                this.configurationProvider.openIDConfiguration.responseType === 'code'
            ) {
                if (isRenewProcess && this.userDataInternal.value) {
                    this.storagePersistanceService.sessionState = result.session_state;
                    observer.next(true);
                    observer.complete();
                } else {
                    this.oidcSecurityUserService.initUserData().subscribe(() => {
                        this.loggerService.logDebug('authorizedCallback (id_token token || code) flow');

                        const userData = this.oidcSecurityUserService.getUserData();

                        if (this.tokenValidationService.validateUserdataSubIdToken(decodedIdToken.sub, userData.sub)) {
                            this.setUserData(userData);
                            this.loggerService.logDebug(this.storagePersistanceService.accessToken);
                            this.loggerService.logDebug(this.oidcSecurityUserService.getUserData());

                            this.storagePersistanceService.sessionState = result.session_state;

                            this.runTokenValidation();
                            observer.next(true);
                        } else {
                            // something went wrong, userdata sub does not match that from id_token
                            this.loggerService.logWarning('authorizedCallback, User data sub does not match sub in id_token');
                            this.loggerService.logDebug('authorizedCallback, token(s) validation failed, resetting');
                            this.resetAuthorizationData(false);
                            observer.next(false);
                        }
                        observer.complete();
                    });
                }
            } else {
                // flow id_token
                this.loggerService.logDebug('authorizedCallback id_token flow');
                this.loggerService.logDebug(this.storagePersistanceService.accessToken);

                // userData is set to the id_token decoded. No access_token.
                this.oidcSecurityUserService.setUserData(decodedIdToken);
                this.setUserData(this.oidcSecurityUserService.getUserData());

                this.storagePersistanceService.sessionState = result.session_state;

                this.runTokenValidation();

                observer.next(true);
                observer.complete();
            }
        });
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

    refreshSession(): Observable<boolean> {
        if (!this.configurationProvider.openIDConfiguration.silentRenewUrl) {
            return of(false);
        }

        this.loggerService.logDebug('BEGIN refresh session Authorize');
        this.storagePersistanceService.silentRenewRunning = 'running';

        let state = this.storagePersistanceService.authStateControl;
        if (state === '' || state === null) {
            state = this.createRandom(40);
            this.storagePersistanceService.authStateControl = state;
        }

        const nonce = this.createRandom(40);
        this.storagePersistanceService.authNonce = nonce;
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + this.storagePersistanceService.authStateControl);

        let url = '';

        // Code Flow
        if (this.configurationProvider.openIDConfiguration.responseType === 'code') {
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
            const codeVerifier = this.createRandom(67);
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

        return this.getIsAuthorized().pipe(
            first((isAuthorized) => isAuthorized),
            switchMap(() => {
                return this.oidcSecuritySilentRenew.startRenew(url).pipe(map(() => true));
            })
        );
    }

    handleError(error: any) {
        const silentRenew = this.storagePersistanceService.silentRenewRunning;
        const isRenewProcess = silentRenew === 'running';
        this.loggerService.logError(error);
        if (error.status === 403 || error.status === '403') {
            if (this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent) {
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.NotSet, isRenewProcess)
                );
            } else {
                this.router.navigate([this.configurationProvider.openIDConfiguration.forbiddenRoute]);
            }
        } else if (error.status === 401 || error.status === '401') {
            const silentRenewRunning = this.storagePersistanceService.silentRenewRunning;

            this.resetAuthorizationData(!!silentRenewRunning);

            if (this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent) {
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.NotSet, isRenewProcess)
                );
            } else {
                this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
            }
        }
    }

    startCheckingSilentRenew(): void {
        this.runTokenValidation();
    }

    stopCheckingSilentRenew(): void {
        if (this.scheduledHeartBeatInternal) {
            clearTimeout(this.scheduledHeartBeatInternal);
            this.scheduledHeartBeatInternal = null;
            this.runTokenValidationRunning = false;
        }
    }

    resetAuthorizationData(isRenewProcess: boolean): void {
        if (!isRenewProcess) {
            if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
                // Clear user data. Fixes #97.
                this.setUserData('');
            }

            this.storagePersistanceService.resetStorageData(isRenewProcess);
            this.setIsAuthorized(false);
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

    private setUserData(userData: any): void {
        this.storagePersistanceService.userData = userData;
        this.userDataInternal.next(userData);
    }

    private setIsAuthorized(isAuthorized: boolean): void {
        this.isAuthorizedInternal.next(isAuthorized);
    }

    private setAuthorizationData(accessToken: any, idToken: any) {
        if (this.storagePersistanceService.accessToken !== '') {
            this.storagePersistanceService.accessToken = '';
        }

        this.loggerService.logDebug(accessToken);
        this.loggerService.logDebug(idToken);
        this.loggerService.logDebug('storing to storage, getting the roles');
        this.storagePersistanceService.accessToken = accessToken;
        this.storagePersistanceService.idToken = idToken;
        this.setIsAuthorized(true);
        this.storagePersistanceService.isAuthorized = true;
    }

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
    private runTokenValidation() {
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
                    `\tidToken: ${!!this.getIdToken()}\r\n` +
                    `\t_userData.value: ${!!this.userDataInternal.value}`
            );
            if (this.userDataInternal.value && this.storagePersistanceService.silentRenewRunning !== 'running' && this.getIdToken()) {
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

    private silentRenewEventHandler(e: CustomEvent) {
        this.loggerService.logDebug('silentRenewEventHandler');

        if (this.configurationProvider.openIDConfiguration.responseType === 'code') {
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
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.LoginRequired, true)
                );
                this.resetAuthorizationData(false);
                this.storagePersistanceService.authNonce = '';
                this.loggerService.logDebug(e.detail.toString());
            }
        } else {
            // ImplicitFlow
            this.authorizedImplicitFlowCallback(e.detail);
        }
    }

    private createRandom(requiredLength: number): string {
        const length = requiredLength - 6;
        const arr = new Uint8Array((length || length) / 2);
        window.crypto.getRandomValues(arr);
        return Array.from(arr, this.tohex).join('') + this.randomString(7);
    }

    private tohex(dec) {
        return ('0' + dec.toString(16)).substr(-2);
    }

    private randomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        const values = new Uint32Array(length);
        window.crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += characters[values[i] % characters.length];
        }

        return result;
    }
}
