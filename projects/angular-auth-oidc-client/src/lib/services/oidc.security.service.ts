import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, of, Subject, throwError as observableThrowError, timer } from 'rxjs';
import { catchError, filter, map, race, shareReplay, switchMap, switchMapTo, take, tap } from 'rxjs/operators';
import { OidcDataService } from '../data-services/oidc-data.service';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { AuthorizationResult } from '../models/authorization-result';
import { AuthorizationState } from '../models/authorization-state.enum';
import { JwtKeys } from '../models/jwtkeys';
import { ValidateStateResult } from '../models/validate-state-result.model';
import { ValidationResult } from '../models/validation-result.enum';
import { AuthConfiguration, OpenIDImplicitFlowConfiguration } from '../modules/auth.configuration';
import { StateValidationService } from './oidc-security-state-validation.service';
import { TokenHelperService } from './oidc-token-helper.service';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCheckSession } from './oidc.security.check-session';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcSecuritySilentRenew } from './oidc.security.silent-renew';
import { OidcSecurityUserService } from './oidc.security.user-service';
import { OidcSecurityValidation } from './oidc.security.validation';
import { UriEncoder } from './uri-encoder';

@Injectable()
export class OidcSecurityService {
    private onModuleSetupInternal = new Subject<boolean>();
    private onCheckSessionChangedInternal = new Subject<boolean>();
    private onAuthorizationResultInternal = new Subject<AuthorizationResult>();

    public get onModuleSetup(): Observable<boolean> {
        return this.onModuleSetupInternal.asObservable();
    }

    public get onAuthorizationResult(): Observable<AuthorizationResult> {
        return this.onAuthorizationResultInternal.asObservable();
    }

    public get onCheckSessionChanged(): Observable<boolean> {
        return this.onCheckSessionChangedInternal.asObservable();
    }

    public get onConfigurationChange(): Observable<OpenIDImplicitFlowConfiguration> {
        return this.authConfiguration.onConfigurationChange;
    }

    checkSessionChanged = false;
    moduleSetup = false;

    private isModuleSetupInternal = new BehaviorSubject<boolean>(false);

    private authWellKnownEndpoints: AuthWellKnownEndpoints | undefined;
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
        private authConfiguration: AuthConfiguration,
        private router: Router,
        private oidcSecurityCheckSession: OidcSecurityCheckSession,
        private oidcSecuritySilentRenew: OidcSecuritySilentRenew,
        private oidcSecurityUserService: OidcSecurityUserService,
        private oidcSecurityCommon: OidcSecurityCommon,
        private oidcSecurityValidation: OidcSecurityValidation,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService,
        private zone: NgZone,
        private readonly httpClient: HttpClient
    ) {
        this.onModuleSetup.pipe(take(1)).subscribe(() => {
            this.moduleSetup = true;
            this.isModuleSetupInternal.next(true);
        });

        this.isSetupAndAuthorizedInternal = this.onModuleSetupInternal.pipe(
            filter((isModuleSetup: boolean) => isModuleSetup),
            switchMap(() => {
                if (!this.authConfiguration.silent_renew) {
                    return from([true]).pipe(
                        tap(() => this.loggerService.logDebug(`IsAuthorizedRace: Silent Renew Not Active. Emitting.`))
                    );
                }

                const race$ = this.isAuthorizedInternal.asObservable().pipe(
                    filter((isAuthorized: boolean) => isAuthorized),
                    take(1),
                    tap(() => this.loggerService.logDebug('IsAuthorizedRace: Existing token is still authorized.')),
                    race(
                        this.onAuthorizationResultInternal.pipe(
                            take(1),
                            tap(() => this.loggerService.logDebug('IsAuthorizedRace: Silent Renew Refresh Session Complete')),
                            map(() => true)
                        ),
                        timer(5000).pipe(
                            // backup, if nothing happens after 5 seconds stop waiting and emit
                            tap(() => this.loggerService.logWarning('IsAuthorizedRace: Timeout reached. Emitting.')),
                            map(() => true)
                        )
                    )
                );

                this.loggerService.logDebug('Silent Renew is active, check if token in storage is active');
                if (this.oidcSecurityCommon.authNonce === '' || this.oidcSecurityCommon.authNonce === undefined) {
                    // login not running, or a second silent renew, user must login first before this will work.
                    this.loggerService.logDebug('Silent Renew or login not running, try to refresh the session');
                    this.refreshSession();
                }

                return race$;
            }),
            tap(() => this.loggerService.logDebug('IsAuthorizedRace: Completed')),
            switchMapTo(this.isAuthorizedInternal.asObservable()),
            tap((isAuthorized: boolean) => this.loggerService.logDebug(`getIsAuthorized: ${isAuthorized}`)),
            shareReplay(1)
        );

        this.isSetupAndAuthorizedInternal.pipe(filter(() => this.authConfiguration.start_checksession)).subscribe(isSetupAndAuthorized => {
            if (isSetupAndAuthorized) {
                this.oidcSecurityCheckSession.startCheckingSession(this.authConfiguration.client_id);
            } else {
                this.oidcSecurityCheckSession.stopCheckingSession();
            }
        });
    }

    setupModule(openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration, authWellKnownEndpoints: AuthWellKnownEndpoints): void {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
        this.authConfiguration.init(openIDImplicitFlowConfiguration);
        this.stateValidationService.setupModule(authWellKnownEndpoints);
        this.oidcSecurityCheckSession.setupModule(authWellKnownEndpoints);
        this.oidcSecurityUserService.setupModule(authWellKnownEndpoints);

        this.oidcSecurityCheckSession.onCheckSessionChanged.subscribe(() => {
            this.loggerService.logDebug('onCheckSessionChanged');
            this.checkSessionChanged = true;
            this.onCheckSessionChangedInternal.next(this.checkSessionChanged);
        });

        const userData = this.oidcSecurityCommon.userData;
        if (userData) {
            this.setUserData(userData);
        }

        const isAuthorized = this.oidcSecurityCommon.isAuthorized;
        if (isAuthorized) {
            this.loggerService.logDebug('IsAuthorized setup module');
            this.loggerService.logDebug(this.oidcSecurityCommon.idToken);
            if (
                this.oidcSecurityValidation.isTokenExpired(
                    this.oidcSecurityCommon.idToken,
                    this.authConfiguration.silent_renew_offset_in_seconds
                )
            ) {
                this.loggerService.logDebug('IsAuthorized setup module; id_token isTokenExpired');
            } else {
                this.loggerService.logDebug('IsAuthorized setup module; id_token is valid');
                this.setIsAuthorized(isAuthorized);
            }
            this.runTokenValidation();
        }

        this.loggerService.logDebug('STS server: ' + this.authConfiguration.stsServer);

        this.onModuleSetupInternal.next();

        if (this.authConfiguration.silent_renew) {
            this.oidcSecuritySilentRenew.initRenew();

            // Support authorization via DOM events.
            // Deregister if OidcSecurityService.setupModule is called again by any instance.
            //      We only ever want the latest setup service to be reacting to this event.
            this.boundSilentRenewEvent = this.silentRenewEventHandler.bind(this);

            const instanceId = Math.random();

            const boundSilentRenewInitEvent = ((e: CustomEvent) => {
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

    getUserData(): Observable<any> {
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

        const token = this.oidcSecurityCommon.getAccessToken();
        return decodeURIComponent(token);
    }

    getIdToken(): string {
        if (!this.isAuthorizedInternal.getValue()) {
            return '';
        }

        const token = this.oidcSecurityCommon.getIdToken();
        return decodeURIComponent(token);
    }

    getPayloadFromIdToken(encode = false): any {
        const token = this.getIdToken();
        return this.tokenHelperService.getPayloadFromToken(token, encode);
    }

    setState(state: string): void {
        this.oidcSecurityCommon.authStateControl = state;
    }

    getState(): string {
        return this.oidcSecurityCommon.authStateControl;
    }

    setCustomRequestParameters(params: { [key: string]: string | number | boolean }) {
        this.oidcSecurityCommon.customRequestParams = params;
    }

    // Code Flow with PCKE or Implicit Flow
    authorize(urlHandler?: (url: string) => any) {
        if (this.authWellKnownEndpoints) {
            this.authWellKnownEndpointsLoaded = true;
        }

        if (!this.authWellKnownEndpointsLoaded) {
            this.loggerService.logError('Well known endpoints must be loaded before user can login!');
            return;
        }

        if (!this.oidcSecurityValidation.config_validate_response_type(this.authConfiguration.response_type)) {
            // invalid response_type
            return;
        }

        this.resetAuthorizationData(false);

        this.loggerService.logDebug('BEGIN Authorize Code Flow, no auth data');

        let state = this.oidcSecurityCommon.authStateControl;
        if (!state) {
            state = Date.now() + '' + Math.random();
            this.oidcSecurityCommon.authStateControl = state;
        }

        const nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.authNonce = nonce;
        this.loggerService.logDebug('AuthorizedController created. local state: ' + this.oidcSecurityCommon.authStateControl);

        let url = '';
        // Code Flow
        if (this.authConfiguration.response_type === 'code') {
            // code_challenge with "S256"
            const codeVerifier = 'C' + Math.random() + '' + Date.now() + '' + Date.now() + Math.random();
            const codeChallenge = this.oidcSecurityValidation.generate_code_verifier(codeVerifier);

            this.oidcSecurityCommon.code_verifier = codeVerifier;

            if (this.authWellKnownEndpoints) {
                url = this.createAuthorizeUrl(
                    true,
                    codeChallenge,
                    this.authConfiguration.redirect_url,
                    nonce,
                    state,
                    this.authWellKnownEndpoints.authorization_endpoint
                );
            } else {
                this.loggerService.logError('authWellKnownEndpoints is undefined');
            }
        } else {
            // Implicit Flow

            if (this.authWellKnownEndpoints) {
                url = this.createAuthorizeUrl(
                    false,
                    '',
                    this.authConfiguration.redirect_url,
                    nonce,
                    state,
                    this.authWellKnownEndpoints.authorization_endpoint
                );
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
        const urlParts = urlToCheck.split('?');
        const params = new HttpParams({
            fromString: urlParts[1],
        });
        const code = params.get('code');
        const state = params.get('state');
        const sessionState = params.get('session_state');

        if (code && state) {
            this.requestTokensWithCode(code, state, sessionState);
        }
    }

    // Code Flow
    requestTokensWithCode(code: string, state: string, sessionState: string | null) {
        this.isModuleSetupInternal
            .pipe(
                filter((isModuleSetup: boolean) => isModuleSetup),
                take(1)
            )
            .subscribe(() => {
                this.requestTokensWithCodeProcedure(code, state, sessionState);
            });
    }

    // Code Flow with PCKE
    requestTokensWithCodeProcedure(code: string, state: string, sessionState: string | null) {
        let tokenRequestUrl = '';
        if (this.authWellKnownEndpoints && this.authWellKnownEndpoints.token_endpoint) {
            tokenRequestUrl = `${this.authWellKnownEndpoints.token_endpoint}`;
        }

        if (!this.oidcSecurityValidation.validateStateFromHashCallback(state, this.oidcSecurityCommon.authStateControl)) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            // ValidationResult.StatesDoNotMatch;
            return;
        }

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        let data =
            `grant_type=authorization_code&client_id=${this.authConfiguration.client_id}` +
            `&code_verifier=${this.oidcSecurityCommon.code_verifier}&code=${code}&redirect_uri=${this.authConfiguration.redirect_url}`;
        if (this.oidcSecurityCommon.silentRenewRunning === 'running') {
            data =
                `grant_type=authorization_code&client_id=${this.authConfiguration.client_id}` +
                `&code_verifier=${this.oidcSecurityCommon.code_verifier}&code=${code}&redirect_uri=${
                    this.authConfiguration.silent_redirect_url
                }`;
        }

        this.httpClient
            .post(tokenRequestUrl, data, { headers })
            .pipe(
                map(response => {
                    let obj: any = new Object();
                    obj = response;
                    obj.state = state;
                    obj.session_state = sessionState;

                    this.authorizedCodeFlowCallbackProcedure(obj);
                }),
                catchError(error => {
                    this.loggerService.logError(error);
                    this.loggerService.logError(`OidcService code request ${this.authConfiguration.stsServer}`);
                    return of(false);
                })
            )
            .subscribe();
    }

    // Code Flow
    private authorizedCodeFlowCallbackProcedure(result: any) {
        const silentRenew = this.oidcSecurityCommon.silentRenewRunning;
        const isRenewProcess = silentRenew === 'running';

        this.loggerService.logDebug('BEGIN authorized Code Flow Callback, no auth data');
        this.resetAuthorizationData(isRenewProcess);

        this.authorizedCallbackProcedure(result, isRenewProcess);
    }

    // Implicit Flow
    private authorizedImplicitFlowCallbackProcedure(hash?: string) {
        const silentRenew = this.oidcSecurityCommon.silentRenewRunning;
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
        this.oidcSecurityCommon.authResult = result;

        if (!this.authConfiguration.history_cleanup_off && !isRenewProcess) {
            // reset the history to remove the tokens
            window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
        } else {
            this.loggerService.logDebug('history clean up inactive');
        }

        if (result.error) {
            this.loggerService.logWarning(result);
            if ((result.error as string) === 'login_required') {
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.LoginRequired)
                );
            } else {
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.SecureTokenServerError)
                );
            }

            if (!this.authConfiguration.trigger_authorization_result_event && !isRenewProcess) {
                this.router.navigate([this.authConfiguration.unauthorized_route]);
            }
        } else {
            this.loggerService.logDebug(result);

            this.loggerService.logDebug('authorizedCallback created, begin token validation');

            this.getSigningKeys().subscribe(
                jwtKeys => {
                    const validationResult = this.getValidatedStateResult(result, jwtKeys);

                    if (validationResult.authResponseIsValid) {
                        this.setAuthorizationData(validationResult.access_token, validationResult.id_token);
                        this.oidcSecurityCommon.silentRenewRunning = '';

                        if (this.authConfiguration.auto_userinfo) {
                            this.getUserinfo(
                                isRenewProcess,
                                result,
                                validationResult.id_token,
                                validationResult.decoded_id_token
                            ).subscribe(
                                response => {
                                    if (response) {
                                        this.onAuthorizationResultInternal.next(
                                            new AuthorizationResult(AuthorizationState.authorized, validationResult.state)
                                        );
                                        if (!this.authConfiguration.trigger_authorization_result_event && !isRenewProcess) {
                                            this.router.navigate([this.authConfiguration.post_login_route]);
                                        }
                                    } else {
                                        this.onAuthorizationResultInternal.next(
                                            new AuthorizationResult(AuthorizationState.unauthorized, validationResult.state)
                                        );
                                        if (!this.authConfiguration.trigger_authorization_result_event && !isRenewProcess) {
                                            this.router.navigate([this.authConfiguration.unauthorized_route]);
                                        }
                                    }
                                },
                                err => {
                                    /* Something went wrong while getting signing key */
                                    this.loggerService.logWarning('Failed to retreive user info with error: ' + JSON.stringify(err));
                                }
                            );
                        } else {
                            if (!isRenewProcess) {
                                // userData is set to the id_token decoded, auto get user data set to false
                                this.oidcSecurityUserService.setUserData(validationResult.decoded_id_token);
                                this.setUserData(this.oidcSecurityUserService.getUserData());
                            }

                            this.runTokenValidation();

                            this.onAuthorizationResultInternal.next(
                                new AuthorizationResult(AuthorizationState.authorized, validationResult.state)
                            );
                            if (!this.authConfiguration.trigger_authorization_result_event && !isRenewProcess) {
                                this.router.navigate([this.authConfiguration.post_login_route]);
                            }
                        }
                    } else {
                        // something went wrong
                        this.loggerService.logWarning('authorizedCallback, token(s) validation failed, resetting');
                        this.loggerService.logWarning(window.location.hash);
                        this.resetAuthorizationData(false);
                        this.oidcSecurityCommon.silentRenewRunning = '';

                        this.onAuthorizationResultInternal.next(
                            new AuthorizationResult(AuthorizationState.unauthorized, validationResult.state)
                        );
                        if (!this.authConfiguration.trigger_authorization_result_event && !isRenewProcess) {
                            this.router.navigate([this.authConfiguration.unauthorized_route]);
                        }
                    }
                },
                err => {
                    /* Something went wrong while getting signing key */
                    this.loggerService.logWarning('Failed to retreive siging key with error: ' + JSON.stringify(err));
                    this.oidcSecurityCommon.silentRenewRunning = '';
                }
            );
        }
    }

    getUserinfo(isRenewProcess = false, result?: any, idToken?: any, decodedIdToken?: any): Observable<boolean> {
        result = result ? result : this.oidcSecurityCommon.authResult;
        idToken = idToken ? idToken : this.oidcSecurityCommon.idToken;
        decodedIdToken = decodedIdToken ? decodedIdToken : this.tokenHelperService.getPayloadFromToken(idToken, false);

        return new Observable<boolean>(observer => {
            // flow id_token token
            if (this.authConfiguration.response_type === 'id_token token' || this.authConfiguration.response_type === 'code') {
                if (isRenewProcess && this.userDataInternal.value) {
                    this.oidcSecurityCommon.sessionState = result.session_state;
                    observer.next(true);
                    observer.complete();
                } else {
                    this.oidcSecurityUserService.initUserData().subscribe(() => {
                        this.loggerService.logDebug('authorizedCallback (id_token token || code) flow');

                        const userData = this.oidcSecurityUserService.getUserData();

                        if (this.oidcSecurityValidation.validate_userdata_sub_id_token(decodedIdToken.sub, userData.sub)) {
                            this.setUserData(userData);
                            this.loggerService.logDebug(this.oidcSecurityCommon.accessToken);
                            this.loggerService.logDebug(this.oidcSecurityUserService.getUserData());

                            this.oidcSecurityCommon.sessionState = result.session_state;

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
                this.loggerService.logDebug(this.oidcSecurityCommon.accessToken);

                // userData is set to the id_token decoded. No access_token.
                this.oidcSecurityUserService.setUserData(decodedIdToken);
                this.setUserData(this.oidcSecurityUserService.getUserData());

                this.oidcSecurityCommon.sessionState = result.session_state;

                this.runTokenValidation();

                observer.next(true);
                observer.complete();
            }
        });
    }

    logoff(urlHandler?: (url: string) => any) {
        // /connect/endsession?id_token_hint=...&post_logout_redirect_uri=https://myapp.com
        this.loggerService.logDebug('BEGIN Authorize, no auth data');

        if (this.authWellKnownEndpoints) {
            if (this.authWellKnownEndpoints.end_session_endpoint) {
                const end_session_endpoint = this.authWellKnownEndpoints.end_session_endpoint;
                const idTokenHint = this.oidcSecurityCommon.idToken;
                const url = this.createEndSessionUrl(end_session_endpoint, idTokenHint);

                this.resetAuthorizationData(false);

                if (this.authConfiguration.start_checksession && this.checkSessionChanged) {
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

    refreshSession(): Observable<any> {
        if (!this.authConfiguration.silent_renew) {
            return from([false]);
        }

        this.loggerService.logDebug('BEGIN refresh session Authorize');

        let state = this.oidcSecurityCommon.authStateControl;
        if (state === '' || state === null) {
            state = Date.now() + '' + Math.random();
            this.oidcSecurityCommon.authStateControl = state;
        }

        const nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.authNonce = nonce;
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + this.oidcSecurityCommon.authStateControl);

        let url = '';

        // Code Flow
        if (this.authConfiguration.response_type === 'code') {
            // code_challenge with "S256"
            const codeVerifier = 'C' + Math.random() + '' + Date.now() + '' + Date.now() + Math.random();
            const codeChallenge = this.oidcSecurityValidation.generate_code_verifier(codeVerifier);

            this.oidcSecurityCommon.code_verifier = codeVerifier;

            if (this.authWellKnownEndpoints) {
                url = this.createAuthorizeUrl(
                    true,
                    codeChallenge,
                    this.authConfiguration.silent_redirect_url,
                    nonce,
                    state,
                    this.authWellKnownEndpoints.authorization_endpoint,
                    'none'
                );
            } else {
                this.loggerService.logWarning('authWellKnownEndpoints is undefined');
            }
        } else {
            if (this.authWellKnownEndpoints) {
                url = this.createAuthorizeUrl(
                    false,
                    '',
                    this.authConfiguration.silent_redirect_url,
                    nonce,
                    state,
                    this.authWellKnownEndpoints.authorization_endpoint,
                    'none'
                );
            } else {
                this.loggerService.logWarning('authWellKnownEndpoints is undefined');
            }
        }

        this.oidcSecurityCommon.silentRenewRunning = 'running';
        return this.oidcSecuritySilentRenew.startRenew(url);
    }

    handleError(error: any) {
        this.loggerService.logError(error);
        if (error.status === 403 || error.status === '403') {
            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResultInternal.next(new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.NotSet));
            } else {
                this.router.navigate([this.authConfiguration.forbidden_route]);
            }
        } else if (error.status === 401 || error.status === '401') {
            const silentRenew = this.oidcSecurityCommon.silentRenewRunning;

            this.resetAuthorizationData(!!silentRenew);

            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResultInternal.next(new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.NotSet));
            } else {
                this.router.navigate([this.authConfiguration.unauthorized_route]);
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
            if (this.authConfiguration.auto_userinfo) {
                // Clear user data. Fixes #97.
                this.setUserData('');
            }

            this.oidcSecurityCommon.resetStorageData(isRenewProcess);
            this.checkSessionChanged = false;
            this.setIsAuthorized(false);
        }
    }

    getEndSessionUrl(): string | undefined {
        if (this.authWellKnownEndpoints) {
            if (this.authWellKnownEndpoints.end_session_endpoint) {
                const end_session_endpoint = this.authWellKnownEndpoints.end_session_endpoint;
                const idTokenHint = this.oidcSecurityCommon.idToken;
                return this.createEndSessionUrl(end_session_endpoint, idTokenHint);
            }
        }
    }

    private getValidatedStateResult(result: any, jwtKeys: JwtKeys): ValidateStateResult {
        if (result.error) {
            return new ValidateStateResult('', '', false, {});
        }

        return this.stateValidationService.validateState(result, jwtKeys);
    }

    private setUserData(userData: any): void {
        this.oidcSecurityCommon.userData = userData;
        this.userDataInternal.next(userData);
    }

    private setIsAuthorized(isAuthorized: boolean): void {
        this.isAuthorizedInternal.next(isAuthorized);
    }

    private setAuthorizationData(accessToken: any, idToken: any) {
        if (this.oidcSecurityCommon.accessToken !== '') {
            this.oidcSecurityCommon.accessToken = '';
        }

        this.loggerService.logDebug(accessToken);
        this.loggerService.logDebug(idToken);
        this.loggerService.logDebug('storing to storage, getting the roles');
        this.oidcSecurityCommon.accessToken = accessToken;
        this.oidcSecurityCommon.idToken = idToken;
        this.setIsAuthorized(true);
        this.oidcSecurityCommon.isAuthorized = true;
    }

    private createAuthorizeUrl(
        isCodeFlow: boolean,
        codeChallenge: string,
        redirectUrl: string,
        nonce: string,
        state: string,
        authorizationEndpoint: string,
        prompt?: string
    ): string {
        const urlParts = authorizationEndpoint.split('?');
        const authorizationUrl = urlParts[0];
        let params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });
        params = params.set('client_id', this.authConfiguration.client_id);
        params = params.append('redirect_uri', redirectUrl);
        params = params.append('response_type', this.authConfiguration.response_type);
        params = params.append('scope', this.authConfiguration.scope);
        params = params.append('nonce', nonce);
        params = params.append('state', state);

        if (isCodeFlow) {
            params = params.append('code_challenge', codeChallenge);
            params = params.append('code_challenge_method', 'S256');
        }

        if (prompt) {
            params = params.append('prompt', prompt);
        }

        if (this.authConfiguration.hd_param) {
            params = params.append('hd', this.authConfiguration.hd_param);
        }

        const customParams = Object.assign({}, this.oidcSecurityCommon.customRequestParams);

        Object.keys(customParams).forEach(key => {
            params = params.append(key, customParams[key].toString());
        });

        return `${authorizationUrl}?${params}`;
    }

    private createEndSessionUrl(endSessionEndpoint: string, idTokenHint: string) {
        const urlParts = endSessionEndpoint.split('?');

        const authorizationEndsessionUrl = urlParts[0];

        let params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });
        params = params.set('id_token_hint', idTokenHint);
        params = params.append('post_logout_redirect_uri', this.authConfiguration.post_logout_redirect_uri);

        return `${authorizationEndsessionUrl}?${params}`;
    }

    private getSigningKeys(): Observable<JwtKeys> {
        if (this.authWellKnownEndpoints) {
            this.loggerService.logDebug('jwks_uri: ' + this.authWellKnownEndpoints.jwks_uri);

            return this.oidcDataService.get<JwtKeys>(this.authWellKnownEndpoints.jwks_uri).pipe(catchError(this.handleErrorGetSigningKeys));
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
        console.error(errMsg);
        return observableThrowError(errMsg);
    }

    private runTokenValidation() {
        if (this.runTokenValidationRunning || !this.authConfiguration.silent_renew) {
            return;
        }
        this.runTokenValidationRunning = true;
        this.loggerService.logDebug('runTokenValidation silent-renew running');

        /*
            First time: delay 10 seconds to call silentRenewHeartBeatCheck
            Afterwards: Run this check in a 5 second interval only AFTER the previous operation ends.
        */
        const silentRenewHeartBeatCheck = () => {
            this.loggerService.logDebug(
                'silentRenewHeartBeatCheck\r\n' +
                    `\tsilentRenewRunning: ${this.oidcSecurityCommon.silentRenewRunning === 'running'}\r\n` +
                    `\tidToken: ${!!this.getIdToken()}\r\n` +
                    `\t_userData.value: ${!!this.userDataInternal.value}`
            );
            if (this.userDataInternal.value && this.oidcSecurityCommon.silentRenewRunning !== 'running' && this.getIdToken()) {
                if (
                    this.oidcSecurityValidation.isTokenExpired(
                        this.oidcSecurityCommon.idToken,
                        this.authConfiguration.silent_renew_offset_in_seconds
                    )
                ) {
                    this.loggerService.logDebug('IsAuthorized: id_token isTokenExpired, start silent renew if active');

                    if (this.authConfiguration.silent_renew) {
                        this.refreshSession().subscribe(
                            () => {
                                this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                            },
                            (err: any) => {
                                this.loggerService.logError('Error: ' + err);
                                this.scheduledHeartBeatInternal = setTimeout(silentRenewHeartBeatCheck, 3000);
                            }
                        );
                        /* In this situation, we schedule a heatbeat check only when silentRenew is finished.
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

        if (this.authConfiguration.response_type === 'code') {
            const urlParts = e.detail.toString().split('?');
            const params = new HttpParams({
                fromString: urlParts[1],
            });
            const code = params.get('code');
            const state = params.get('state');
            const sessionState = params.get('session_state');
            const error = params.get('error');
            if (code && state && sessionState) {
                this.requestTokensWithCodeProcedure(code, state, sessionState);
            }
            if (error) {
                this.loggerService.logDebug(e.detail.toString());
            }
        } else {
            // ImplicitFlow
            this.authorizedImplicitFlowCallback(e.detail);
        }
    }
}
