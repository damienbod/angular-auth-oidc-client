import { isPlatformBrowser } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { EventEmitter, Inject, Injectable, NgZone, Output, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError as observableThrowError, timer } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, switchMapTo, take, tap, race } from 'rxjs/operators';
import { OidcDataService } from '../data-services/oidc-data.service';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { AuthorizationResult } from '../models/authorization-result.enum';
import { JwtKeys } from '../models/jwtkeys';
import { ValidateStateResult } from '../models/validate-state-result.model';
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
    @Output()
    onModuleSetup = new EventEmitter<boolean>();
    @Output()
    onAuthorizationResult = new EventEmitter<AuthorizationResult>();
    @Output()
    onCheckSessionChanged = new EventEmitter<boolean>();

    checkSessionChanged = false;
    moduleSetup = false;

    private _isModuleSetup = new BehaviorSubject<boolean>(false);

    private authWellKnownEndpoints: AuthWellKnownEndpoints | undefined;
    private _isAuthorized = new BehaviorSubject<boolean>(false);
    private _isSetupAndAuthorized: Observable<boolean>;

    private lastUserData: any;
    private _userData = new BehaviorSubject<any>('');
    private authWellKnownEndpointsLoaded = false;
    private runTokenValidationRunning = false;
    private _scheduledHeartBeat: any;
    private boundSilentRenewEvent: any;

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
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
        private zone: NgZone
    ) {
        this.onModuleSetup.pipe(take(1)).subscribe(() => {
            this.moduleSetup = true;
            this._isModuleSetup.next(true);
        });

        this._isSetupAndAuthorized = this._isModuleSetup.pipe(
            filter((isModuleSetup: boolean) => isModuleSetup),
            switchMap(() => {
                if (!this.authConfiguration.silent_renew) {
                    return this._isAuthorized.asObservable().pipe(
                        take(1),
                        tap((isAuthorized: boolean) => this.loggerService.logDebug(`IsAuthorizedRace: Existing token isAuthorized: ${isAuthorized}`))
                    );
                }

                const race$ = this._isAuthorized.asObservable().pipe(
                    filter((isAuthorized: boolean) => isAuthorized),
                    take(1),
                    tap(() => this.loggerService.logDebug('IsAuthorizedRace: Existing token is still authorized.')),
                    race(this.onAuthorizationResult.asObservable().pipe(
                            take(1),
                            tap(() => this.loggerService.logDebug(
                                'IsAuthorizedRace: Silent Renew Refresh Session Complete')),
                            map(() => true)
                        ),
                        timer(5000).pipe(  //backup, if nothing happens after 5 seconds stop waiting
                            tap(() => this.loggerService.logWarning(
                                'IsAuthorizedRace: Timeout reached. Emitting.')),
                            map(() => true)
                        ) 
                    )
                );

				// This is required to make the init check if the existing token is valid, but
				// causes 2 login callbacks with a first login.
                //this.refreshSession();

                return race$;
            }),
            tap(() => this.loggerService.logDebug('IsAuthorizedRace: Completed')),
            switchMapTo(this._isAuthorized.asObservable()),
            tap((isAuthorized: boolean) => this.loggerService.logDebug(`getIsAuthorized: ${isAuthorized}`)),
            shareReplay(1)
        );
    }

    setupModule(
        openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration,
        authWellKnownEndpoints: AuthWellKnownEndpoints
    ): void {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
        this.authConfiguration.init(openIDImplicitFlowConfiguration);
        this.stateValidationService.setupModule(authWellKnownEndpoints);
        this.oidcSecurityCheckSession.setupModule(authWellKnownEndpoints);
        this.oidcSecurityUserService.setupModule(authWellKnownEndpoints);

        this.oidcSecurityCheckSession.onCheckSessionChanged.subscribe(() => {
            this.loggerService.logDebug('onCheckSessionChanged');
            this.checkSessionChanged = true;
            this.onCheckSessionChanged.emit(this.checkSessionChanged);
        });

        this._userData.subscribe(() => {
            this.onUserDataChanged();
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

        if (isPlatformBrowser(this.platformId)) {
            // Client only code.
            this.onModuleSetup.emit();

            if (this.authConfiguration.silent_renew) {
                this.oidcSecuritySilentRenew.initRenew();

                // Support authorization via DOM events.
                // Deregister if OidcSecurityService.setupModule is called again by any instance.
                //      We only ever want the latest setup service to be reacting to this event.
                this.boundSilentRenewEvent = this.silentRenewEventHandler.bind(this);

                const instanceId = Math.random();

                const boundSilentRenewInitEvent = ((e: CustomEvent) => {
                    if (e.detail !== instanceId) {
                        window.removeEventListener(
                            'oidc-silent-renew-message',
                            this.boundSilentRenewEvent
                        );
                        window.removeEventListener(
                            'oidc-silent-renew-init',
                            boundSilentRenewInitEvent
                        );
                    }
                }).bind(this);

                window.addEventListener('oidc-silent-renew-init', boundSilentRenewInitEvent, false);
                window.addEventListener(
                    'oidc-silent-renew-message',
                    this.boundSilentRenewEvent,
                    false
                );

                window.dispatchEvent(
                    new CustomEvent('oidc-silent-renew-init', {
                        detail: instanceId,
                    })
                );
            }

            if (
                this.authConfiguration.start_checksession &&
                !this.oidcSecurityCheckSession.doesSessionExist()
            ) {
                this.oidcSecurityCheckSession.init().subscribe(() => {
                    this.oidcSecurityCheckSession.pollServerSession(
                        this.authConfiguration.client_id
                    );
                });
            }
        } else {
            this.onModuleSetup.emit();
        }
    }

    getUserData(): Observable<any> {
        return this._userData.asObservable();
    }

    getIsModuleSetup(): Observable<boolean> {
        return this._isModuleSetup.asObservable();
    }

    getIsAuthorized(): Observable<boolean> {
        return this._isSetupAndAuthorized;
    }

    getToken(): string {
        if (!this._isAuthorized.getValue()) {
            return '';
        }

        const token = this.oidcSecurityCommon.getAccessToken();
        return decodeURIComponent(token);
    }

    getIdToken(): string {
        if (!this._isAuthorized.getValue()) {
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
        this.oidcSecurityCommon.addAuthState(state);
    }

    setCustomRequestParameters(params: { [key: string]: string | number | boolean }) {
        this.oidcSecurityCommon.customRequestParams = params;
    }

    authorize(urlHandler?: (url: string) => any) {
        if (this.authWellKnownEndpoints) {
            this.authWellKnownEndpointsLoaded = true;
        }

        if (!this.authWellKnownEndpointsLoaded) {
            this.loggerService.logError(
                'Well known endpoints must be loaded before user can login!'
            );
            return;
        }

        if (
            !this.oidcSecurityValidation.config_validate_response_type(
                this.authConfiguration.response_type
            )
        ) {
            // invalid response_type
            return;
        }

        this.resetAuthorizationData(false);

        this.loggerService.logDebug('BEGIN Authorize, no auth data');

        const state = Date.now() + '' + Math.random();
        this.oidcSecurityCommon.addAuthState(state);

        const nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.addAuthNonce(nonce);
        this.loggerService.logDebug(
            'AuthorizedController created. local state: ' + state
        );

        if (this.authWellKnownEndpoints) {
            const url = this.createAuthorizeUrl(
                this.authConfiguration.redirect_url,
                nonce,
                state,
                this.authWellKnownEndpoints.authorization_endpoint
            );

            if (urlHandler) {
                urlHandler(url);
            } else {
                window.location.href = url;
            }
        } else {
            this.loggerService.logError('authWellKnownEndpoints is undefined');
        }
    }

    authorizedCallback(hash?: string) {
        const silentRenew = this.oidcSecurityCommon.silentRenewRunning;
        const isRenewProcess = silentRenew === 'running';

        this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
        this.resetAuthorizationData(isRenewProcess);

        hash = hash || window.location.hash.substr(1);

        const result: any = hash.split('&').reduce(function(resultData: any, item: string) {
            const parts = item.split('=');
            resultData[<string>parts.shift()] = parts.join('=');
            return resultData;
        }, {});

        this.oidcSecurityCommon.authResult = result;
        this.loggerService.logDebug(result);
        this.loggerService.logDebug('authorizedCallback created, begin token validation');

        this.getSigningKeys().subscribe(
            jwtKeys => {
                const validationResult = this.getValidatedStateResult(result, jwtKeys);

                if (validationResult.authResponseIsValid) {
                    this.setAuthorizationData(
                        validationResult.access_token,
                        validationResult.id_token
                    );
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
                                    this.onAuthorizationResult.emit(AuthorizationResult.authorized);
                                    if (
                                        !this.authConfiguration
                                            .trigger_authorization_result_event &&
                                        !isRenewProcess
                                    ) {
                                        this.router.navigate([
                                            this.authConfiguration.post_login_route,
                                        ]);
                                    }
                                } else {
                                    this.onAuthorizationResult.emit(
                                        AuthorizationResult.unauthorized
                                    );
                                    if (
                                        !this.authConfiguration
                                            .trigger_authorization_result_event &&
                                        !isRenewProcess
                                    ) {
                                        this.router.navigate([
                                            this.authConfiguration.unauthorized_route,
                                        ]);
                                    }
                                }
                            },
                            err => {
                                /* Something went wrong while getting signing key */
                                this.loggerService.logWarning(
                                    'Failed to retreive user info with error: ' +
                                        JSON.stringify(err)
                                );
                            }
                        );
                    } else {
                        if (!isRenewProcess) {
                            // userData is set to the id_token decoded, auto get user data set to false
                            this.oidcSecurityUserService.setUserData(
                                validationResult.decoded_id_token
                            );
                            this.setUserData(this.oidcSecurityUserService.getUserData());
                        }

                        this.runTokenValidation();

                        this.onAuthorizationResult.emit(AuthorizationResult.authorized);
                        if (
                            !this.authConfiguration.trigger_authorization_result_event &&
                            !isRenewProcess
                        ) {
                            this.router.navigate([this.authConfiguration.post_login_route]);
                        }
                    }
                } else {
                    // something went wrong
                    this.loggerService.logWarning(
                        'authorizedCallback, token(s) validation failed, resetting'
                    );
                    this.loggerService.logWarning(window.location.hash);
                    this.resetAuthorizationData(false);
                    this.oidcSecurityCommon.silentRenewRunning = '';

                    this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
                    if (
                        !this.authConfiguration.trigger_authorization_result_event &&
                        !isRenewProcess
                    ) {
                        this.router.navigate([this.authConfiguration.unauthorized_route]);
                    }
                }
            },
            err => {
                /* Something went wrong while getting signing key */
                this.loggerService.logWarning(
                    'Failed to retreive siging key with error: ' + JSON.stringify(err)
                );
                this.oidcSecurityCommon.silentRenewRunning = '';
            }
        );
    }

    getUserinfo(
        isRenewProcess = false,
        result?: any,
        id_token?: any,
        decoded_id_token?: any
    ): Observable<boolean> {
        result = result ? result : this.oidcSecurityCommon.authResult;
        id_token = id_token ? id_token : this.oidcSecurityCommon.idToken;
        decoded_id_token = decoded_id_token
            ? decoded_id_token
            : this.tokenHelperService.getPayloadFromToken(id_token, false);

        return new Observable<boolean>(observer => {
            // flow id_token token
            if (this.authConfiguration.response_type === 'id_token token') {
                if (isRenewProcess) {
                    this.oidcSecurityCommon.sessionState = result.session_state;
                    observer.next(true);
                    observer.complete();
                } else {
                    this.oidcSecurityUserService.initUserData().subscribe(() => {
                        this.loggerService.logDebug('authorizedCallback id_token token flow');

                        const userData = this.oidcSecurityUserService.getUserData();

                        if (
                            this.oidcSecurityValidation.validate_userdata_sub_id_token(
                                decoded_id_token.sub,
                                userData.sub
                            )
                        ) {
                            this.setUserData(userData);
                            this.loggerService.logDebug(this.oidcSecurityCommon.accessToken);
                            this.loggerService.logDebug(this.oidcSecurityUserService.getUserData());

                            this.oidcSecurityCommon.sessionState = result.session_state;

                            this.runTokenValidation();
                            observer.next(true);
                        } else {
                            // something went wrong, userdata sub does not match that from id_token
                            this.loggerService.logWarning(
                                'authorizedCallback, User data sub does not match sub in id_token'
                            );
                            this.loggerService.logDebug(
                                'authorizedCallback, token(s) validation failed, resetting'
                            );
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
                this.oidcSecurityUserService.setUserData(decoded_id_token);
                this.setUserData(this.oidcSecurityUserService.getUserData());

                this.oidcSecurityCommon.sessionState = result.session_state;

                this.runTokenValidation();

                observer.next(true);
                observer.complete();
            }
        });
    }

    logoff() {
        // /connect/endsession?id_token_hint=...&post_logout_redirect_uri=https://myapp.com
        this.loggerService.logDebug('BEGIN Authorize, no auth data');

        if (this.authWellKnownEndpoints) {
            if (this.authWellKnownEndpoints.end_session_endpoint) {
                const end_session_endpoint = this.authWellKnownEndpoints.end_session_endpoint;
                const id_token_hint = this.oidcSecurityCommon.idToken;
                const url = this.createEndSessionUrl(end_session_endpoint, id_token_hint);

                this.resetAuthorizationData(false);

                if (this.authConfiguration.start_checksession && this.checkSessionChanged) {
                    this.loggerService.logDebug(
                        'only local login cleaned up, server session has changed'
                    );
                } else {
                    window.location.href = url;
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
        this.loggerService.logDebug('BEGIN refresh session Authorize');

        const state = Date.now() + '' + Math.random();
        this.oidcSecurityCommon.addAuthState(state);

        const nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.addAuthNonce(nonce);
        this.loggerService.logDebug(
            `RefreshSession created. adding myautostate: ${state}`
        );

        let url = '';
        if (this.authWellKnownEndpoints) {
            url = this.createAuthorizeUrl(
                this.authConfiguration.silent_redirect_url,
                nonce,
                state,
                this.authWellKnownEndpoints.authorization_endpoint,
                'none'
            );
        } else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }

        this.oidcSecurityCommon.silentRenewRunning = 'running';
        return this.oidcSecuritySilentRenew.startRenew(url);
    }

    handleError(error: any) {
        this.loggerService.logError(error);
        if (error.status === 403 || error.status === '403') {
            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
            } else {
                this.router.navigate([this.authConfiguration.forbidden_route]);
            }
        } else if (error.status === 401 || error.status === '401') {
            const silentRenew = this.oidcSecurityCommon.silentRenewRunning;

            this.resetAuthorizationData(!!silentRenew);

            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
            } else {
                this.router.navigate([this.authConfiguration.unauthorized_route]);
            }
        }
    }

    startCheckingSilentRenew(): void {
        this.runTokenValidation();
    }

    stopCheckingSilentRenew(): void {
        if (this._scheduledHeartBeat) {
            clearTimeout(this._scheduledHeartBeat);
            this._scheduledHeartBeat = null;
            this.runTokenValidationRunning = false;
        }
    }

    resetAuthorizationData(isRenewProcess: boolean): void {
        if (!isRenewProcess) {
            if (this.authConfiguration.auto_userinfo) {
                // Clear user data. Fixes #97.
                this.setUserData('');
            }
            this.setIsAuthorized(false);
            this.oidcSecurityCommon.resetStorageData(isRenewProcess);
            this.checkSessionChanged = false;
        }
    }

    getEndSessionUrl(): string | undefined {
        if (this.authWellKnownEndpoints) {
            if (this.authWellKnownEndpoints.end_session_endpoint) {
                const end_session_endpoint = this.authWellKnownEndpoints.end_session_endpoint;
                const id_token_hint = this.oidcSecurityCommon.idToken;
                return this.createEndSessionUrl(end_session_endpoint, id_token_hint);
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
        this._userData.next(userData);
    }

    private setIsAuthorized(isAuthorized: boolean): void {
        this._isAuthorized.next(isAuthorized);
    }

    private setAuthorizationData(access_token: any, id_token: any) {
        if (this.oidcSecurityCommon.accessToken !== '') {
            this.oidcSecurityCommon.accessToken = '';
        }

        this.loggerService.logDebug(access_token);
        this.loggerService.logDebug(id_token);
        this.loggerService.logDebug('storing to storage, getting the roles');
        this.oidcSecurityCommon.accessToken = access_token;
        this.oidcSecurityCommon.idToken = id_token;
        this.setIsAuthorized(true);
        this.oidcSecurityCommon.isAuthorized = true;
    }

    private createAuthorizeUrl(
        redirect_url: string,
        nonce: string,
        state: string,
        authorization_endpoint: string,
        prompt?: string
    ): string {
        const urlParts = authorization_endpoint.split('?');
        const authorizationUrl = urlParts[0];
        let params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });
        params = params.set('client_id', this.authConfiguration.client_id);
        params = params.append('redirect_uri', redirect_url);
        params = params.append('response_type', this.authConfiguration.response_type);
        params = params.append('scope', this.authConfiguration.scope);
        params = params.append('nonce', nonce);
        params = params.append('state', state);

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

    private createEndSessionUrl(end_session_endpoint: string, id_token_hint: string) {
        const urlParts = end_session_endpoint.split('?');

        const authorizationEndsessionUrl = urlParts[0];

        let params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });
        params = params.set('id_token_hint', id_token_hint);
        params = params.append(
            'post_logout_redirect_uri',
            this.authConfiguration.post_logout_redirect_uri
        );

        return `${authorizationEndsessionUrl}?${params}`;
    }

    private onUserDataChanged() {
        this.loggerService.logDebug(
            `onUserDataChanged: last = ${this.lastUserData}, new = ${this._userData.value}`
        );

        if (this.lastUserData && !this._userData.value) {
            this.loggerService.logDebug('onUserDataChanged: Logout detected.');
            // TODO should we have an action here
        }
        this.lastUserData = this._userData.value;
    }

    private getSigningKeys(): Observable<JwtKeys> {
        if (this.authWellKnownEndpoints) {
            this.loggerService.logDebug('jwks_uri: ' + this.authWellKnownEndpoints.jwks_uri);

            return this.oidcDataService
                .get<JwtKeys>(this.authWellKnownEndpoints.jwks_uri)
                .pipe(catchError(this.handleErrorGetSigningKeys));
        } else {
            this.loggerService.logWarning('getSigningKeys: authWellKnownEndpoints is undefined');
        }

        return this.oidcDataService
            .get<JwtKeys>('undefined')
            .pipe(catchError(this.handleErrorGetSigningKeys));
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
        if (this.runTokenValidationRunning) {
            return;
        }
        this.runTokenValidationRunning = true;
        this.loggerService.logDebug('runTokenValidation silent-renew running');

        /**
            First time: delay 10 seconds to call silentRenewHeartBeatCheck
            Afterwards: Run this check in a 5 second interval only AFTER the previous operation ends.
         */
        const silentRenewHeartBeatCheck = () => {
            this.loggerService.logDebug(
                'silentRenewHeartBeatCheck\r\n' +
                `\tsilentRenewRunning: ${(this.oidcSecurityCommon.silentRenewRunning === 'running')}\r\n` +
                `\tidToken: ${(this.getIdToken() != null)}\r\n` +
                `\t_userData.value: ${(this._userData.value != null)}`
            );
            if (
                this._userData.value &&
                this.oidcSecurityCommon.silentRenewRunning !== 'running' &&
                this.getIdToken()
            ) {
                if (
                    this.oidcSecurityValidation.isTokenExpired(
                        this.oidcSecurityCommon.idToken,
                        this.authConfiguration.silent_renew_offset_in_seconds
                    )
                ) {
                    this.loggerService.logDebug(
                        'IsAuthorized: id_token isTokenExpired, start silent renew if active'
                    );

                    if (this.authConfiguration.silent_renew) {
                        this.refreshSession().subscribe(
                            () => {
                                this._scheduledHeartBeat = setTimeout(
                                    silentRenewHeartBeatCheck,
                                    3000
                                );
                            },
                            (err: any) => {
                                this.loggerService.logError('Error: ' + err);
                                this._scheduledHeartBeat = setTimeout(
                                    silentRenewHeartBeatCheck,
                                    3000
                                );
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
            this._scheduledHeartBeat = setTimeout(silentRenewHeartBeatCheck, 3000);
        };

        this.zone.runOutsideAngular(() => {
            /* Initial heartbeat check */
            this._scheduledHeartBeat = setTimeout(silentRenewHeartBeatCheck, 10000);
        });
    }

    private silentRenewEventHandler(e: CustomEvent) {
        this.loggerService.logDebug('silentRenewEventHandler');
        this.authorizedCallback(e.detail);
    }
}
