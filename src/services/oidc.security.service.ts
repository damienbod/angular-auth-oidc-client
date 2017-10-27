import { PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, EventEmitter, Output } from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/timeInterval';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/take';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/timer';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Router } from '@angular/router';
import { AuthConfiguration, OpenIDImplicitFlowConfiguration } from '../modules/auth.configuration';
import { OidcSecurityValidation } from './oidc.security.validation';
import { OidcSecurityCheckSession } from './oidc.security.check-session';
import { OidcSecuritySilentRenew } from './oidc.security.silent-renew';
import { OidcSecurityUserService } from './oidc.security.user-service';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
import { JwtKeys } from './jwtkeys';
import { AuthorizationResult } from './authorization-result.enum';
import { UriEncoder } from './uri-encoder';

import {
    OidcEvent,
    AuthenticationStart, AuthenticationSuccess, AuthenticationError,
    AuthenticationLogout,
    FetchUserInfoStart, FetchUserInfoSuccess, FetchUserInfoError,
    RefreshTokenStart, RefreshTokenSuccess, RefreshTokenError, RefreshTokenExpired
} from './oidc.security.events';

@Injectable()
export class OidcSecurityService {

    @Output() onModuleSetup: EventEmitter<any> = new EventEmitter<any>(true);
    @Output() onAuthorizationResult: EventEmitter<AuthorizationResult> = new EventEmitter<AuthorizationResult>(true);

    checkSessionChanged: boolean;
    moduleSetup = false;
    private _isAuthorized = new BehaviorSubject<boolean>(false);

    private lastUserData: any = undefined;
    private _userData = new BehaviorSubject<any>('');

    private oidcSecurityValidation: OidcSecurityValidation;
    private jwtKeys: JwtKeys;
    private authWellKnownEndpointsLoaded = false;
    private runTokenValidationRunning: boolean;

    private oidcEvents = new Subject<OidcEvent>();
    private lastEventId = 0;
    private getNextEventId = () => ++this.lastEventId
    private triggerEvent = (event: OidcEvent) => this.oidcEvents.next(event)
    get events(): Observable<OidcEvent> { return this.oidcEvents; }

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private http: HttpClient,
        private authConfiguration: AuthConfiguration,
        private router: Router,
        private oidcSecurityCheckSession: OidcSecurityCheckSession,
        private oidcSecuritySilentRenew: OidcSecuritySilentRenew,
        private oidcSecurityUserService: OidcSecurityUserService,
        private oidcSecurityCommon: OidcSecurityCommon,
        private authWellKnownEndpoints: AuthWellKnownEndpoints
    ) {
    }

    setupModule(openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration): void {

        this.authConfiguration.init(openIDImplicitFlowConfiguration);
        this.oidcSecurityValidation = new OidcSecurityValidation(this.oidcSecurityCommon);

        this.oidcSecurityCheckSession.onCheckSessionChanged.subscribe(() => { this.onCheckSessionChanged(); });
        this.authWellKnownEndpoints.onWellKnownEndpointsLoaded.subscribe(() => { this.onWellKnownEndpointsLoaded(); });
        this._userData.subscribe(() => { this.onUserDataChanged(); });

        this.oidcSecurityCommon.setupModule();

        // Do not call getNextEventId() if there is no event to emit.
        let eventId: number | undefined = undefined;

        const userData = this.oidcSecurityCommon.userData;
        if (userData !== '') {
            this.setUserData(userData);

            eventId = eventId || this.getNextEventId();
            this.triggerEvent(new FetchUserInfoSuccess(eventId));
        }

        const isAuthorized = this.oidcSecurityCommon.isAuthorized;
        if (isAuthorized !== undefined) {
            this.setIsAuthorized(isAuthorized);

            eventId = eventId || this.getNextEventId();
            this.triggerEvent(new AuthenticationSuccess(eventId));

            // Start the silent renew
            this.runTokenValidation();
        }

        this.oidcSecurityCommon.logDebug('STS server: ' + this.authConfiguration.stsServer);

        if (isPlatformBrowser(this.platformId)) {
            // Client only code.
            this.authWellKnownEndpoints.onWellKnownEndpointsLoaded.subscribe(() => {
                this.moduleSetup = true;
                this.onModuleSetup.emit();
            });

            this.authWellKnownEndpoints.setupModule();

            if (this.authConfiguration.silent_renew) {
                this.oidcSecuritySilentRenew.initRenew();
            }

            if (this.authConfiguration.start_checksession) {
                this.oidcSecurityCheckSession.init().subscribe(() => {
                    this.oidcSecurityCheckSession.pollServerSession(this.authConfiguration.client_id);
                });
            }
        } else {
            this.moduleSetup = true;
            this.onModuleSetup.emit();
        }
    }

    getUserData(): Observable<any> {
        return this._userData.asObservable();
    }

    private setUserData(userData: any): void {
        this.oidcSecurityCommon.userData = userData;
        this._userData.next(userData);
    }

    getIsAuthorized(): Observable<boolean> {
        return this._isAuthorized.asObservable();
    }

    private setIsAuthorized(isAuthorized: boolean): void {
        this._isAuthorized.next(isAuthorized);
    }

    getToken(): any {
        if (!this._isAuthorized.value) {
            return '';
        }

        let token = this.oidcSecurityCommon.getAccessToken();
        return decodeURIComponent(token);
    }

    getIdToken(): any {
        if (!this._isAuthorized.value) {
            return '';
        }

        let token = this.oidcSecurityCommon.getIdToken();
        return decodeURIComponent(token);
    }

    getPayloadFromIdToken(encode = false): any {
        const token = this.getIdToken();
        return this.oidcSecurityValidation.getPayloadFromToken(token, encode);
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

    authorize() {
        const eventId = this.getNextEventId();
        this.triggerEvent(new AuthenticationStart(eventId));

        let data = this.oidcSecurityCommon.wellKnownEndpoints;
        if (data && data !== '') {
            this.authWellKnownEndpointsLoaded = true;
        }

        if (!this.authWellKnownEndpointsLoaded) {
            const errorMessage = 'Well known endpoints must be loaded before user can login!';
            this.triggerEvent(new AuthenticationError(eventId, errorMessage));
            this.oidcSecurityCommon.logError(errorMessage);

            // ToDo: Should throw new Error(errorMessage)? Return false?
            return;
        }

        if (!this.oidcSecurityValidation.config_validate_response_type(this.authConfiguration.response_type)) {
            const errorMessage = 'invalid response_type';
            this.triggerEvent(new AuthenticationError(eventId, errorMessage));
            this.oidcSecurityCommon.logError(errorMessage);

            // ToDo: Should throw new Error(errorMessage)? Return false?
            return;
        }

        this.resetAuthorizationData(false);

        this.oidcSecurityCommon.logDebug('BEGIN Authorize, no auth data');

        let state = this.oidcSecurityCommon.authStateControl;
        if (state === '' || state === null) {
            state = Date.now() + '' + Math.random();
            this.oidcSecurityCommon.authStateControl = state;
        }

        let nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.authNonce = nonce;
        this.oidcSecurityCommon.logDebug('AuthorizedController created. local state: ' + this.oidcSecurityCommon.authStateControl);

        let url = this.createAuthorizeUrl(nonce, state, this.authWellKnownEndpoints.authorization_endpoint);
        window.location.href = url;
    }

    authorizedCallback(hash?: string) {
        // ToDo: Preserve original eventId using state?
        const eventId = this.getNextEventId();

        let silentRenew = this.oidcSecurityCommon.silentRenewRunning;
        let isRenewProcess = (silentRenew === 'running');

        this.oidcSecurityCommon.logDebug('BEGIN authorizedCallback, no auth data');
        this.resetAuthorizationData(isRenewProcess);

        hash = hash || window.location.hash.substr(1);

        let result: any = hash.split('&').reduce(function (result: any, item: string) {
            let parts = item.split('=');
            result[parts[0]] = parts[1];
            return result;
        }, {});
        this.oidcSecurityCommon.authResult = result;

        this.oidcSecurityCommon.logDebug(result);
        this.oidcSecurityCommon.logDebug('authorizedCallback created, begin token validation');

        let access_token = '';
        let id_token = '';
        let authResponseIsValid = false;
        let decoded_id_token: any;

        this.getSigningKeys()
            .subscribe(jwtKeys => {
                this.jwtKeys = jwtKeys;

                if (!result.error) {

                    // validate state
                    if (this.oidcSecurityValidation.validateStateFromHashCallback(result.state, this.oidcSecurityCommon.authStateControl)) {
                        if (this.authConfiguration.response_type === 'id_token token') {
                            access_token = result.access_token;
                        }
                        id_token = result.id_token;

                        decoded_id_token = this.oidcSecurityValidation.getPayloadFromToken(id_token, false);

                        // validate jwt signature
                        if (this.oidcSecurityValidation.validate_signature_id_token(id_token, this.jwtKeys)) {
                            // validate nonce
                            if (this.oidcSecurityValidation.validate_id_token_nonce(decoded_id_token, this.oidcSecurityCommon.authNonce)) {
                                // validate required fields id_token
                                if (this.oidcSecurityValidation.validate_required_id_token(decoded_id_token)) {
                                    // validate max offset from the id_token issue to now
                                    if (this.oidcSecurityValidation.validate_id_token_iat_max_offset(decoded_id_token, this.authConfiguration.max_id_token_iat_offset_allowed_in_seconds)) {
                                        // validate iss
                                        if (this.oidcSecurityValidation.validate_id_token_iss(decoded_id_token, this.authWellKnownEndpoints.issuer)) {
                                            // validate aud
                                            if (this.oidcSecurityValidation.validate_id_token_aud(decoded_id_token, this.authConfiguration.client_id)) {
                                                // validate_id_token_exp_not_expired
                                                if (this.oidcSecurityValidation.validate_id_token_exp_not_expired(decoded_id_token)) {
                                                    // flow id_token token
                                                    if (this.authConfiguration.response_type === 'id_token token') {
                                                        // valiadate at_hash and access_token
                                                        if (this.oidcSecurityValidation.validate_id_token_at_hash(access_token, decoded_id_token.at_hash) || !access_token) {
                                                            authResponseIsValid = true;
                                                            this.successful_validation();
                                                        } else {
                                                            this.oidcSecurityCommon.logWarning('authorizedCallback incorrect at_hash');
                                                        }
                                                    } else {
                                                        authResponseIsValid = true;
                                                        this.successful_validation();
                                                    }
                                                } else {
                                                    this.oidcSecurityCommon.logWarning('authorizedCallback token expired');
                                                }
                                            } else {
                                                this.oidcSecurityCommon.logWarning('authorizedCallback incorrect aud');
                                            }
                                        } else {
                                            this.oidcSecurityCommon.logWarning('authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer');
                                        }
                                    } else {
                                        this.oidcSecurityCommon.logWarning('authorizedCallback Validation, iat rejected id_token was issued too far away from the current time');
                                    }
                                } else {
                                    this.oidcSecurityCommon.logDebug('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');
                                }
                            } else {
                                this.oidcSecurityCommon.logWarning('authorizedCallback incorrect nonce');
                            }
                        } else {
                            this.oidcSecurityCommon.logDebug('authorizedCallback Signature validation failed id_token');
                        }
                    } else {
                        this.oidcSecurityCommon.logWarning('authorizedCallback incorrect state');
                    }
                }

                this.oidcSecurityCommon.silentRenewRunning = '';

                if (authResponseIsValid) {
                    this.setAuthorizationData(access_token, id_token);
                    this.triggerEvent(new AuthenticationSuccess(eventId));
                    if (this.authConfiguration.auto_userinfo) {
                        this.triggerEvent(new FetchUserInfoStart(eventId));
                        this.getUserinfo(isRenewProcess, result, id_token, decoded_id_token).subscribe((response) => {
                            if (response) {
                                this.triggerEvent(new FetchUserInfoSuccess(eventId));
                                if (this.authConfiguration.trigger_authorization_result_event) {
                                    this.onAuthorizationResult.emit(AuthorizationResult.authorized);
                                } else {
                                    this.router.navigate([this.authConfiguration.post_login_route]);
                                }
                            } else {
                                this.triggerEvent(new FetchUserInfoError(eventId));
                                if (this.authConfiguration.trigger_authorization_result_event) {
                                    this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
                                } else {
                                    this.router.navigate([this.authConfiguration.unauthorized_route]);
                                }
                            }
                        });
                    } else {
                        this.runTokenValidation();
                        if (this.authConfiguration.trigger_authorization_result_event) {
                            this.onAuthorizationResult.emit(AuthorizationResult.authorized);
                        } else {
                            this.router.navigate([this.authConfiguration.post_login_route]);
                        }
                    }
                } else { // something went wrong
                    const errorMessage = 'authorizedCallback, token(s) validation failed, resetting';
                    this.triggerEvent(new AuthenticationError(eventId, errorMessage));
                    this.oidcSecurityCommon.logDebug(errorMessage);
                    this.resetAuthorizationData(false);
                    if (this.authConfiguration.trigger_authorization_result_event) {
                        this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
                    } else {
                        this.router.navigate([this.authConfiguration.unauthorized_route]);
                    }
                }
            });
    }

    getUserinfo(isRenewProcess = false, result?: any, id_token?: any, decoded_id_token?: any): Observable<boolean> {
        result = result ? result : this.oidcSecurityCommon.authResult;
        id_token = id_token ? id_token : this.oidcSecurityCommon.idToken;
        decoded_id_token = decoded_id_token ? decoded_id_token : this.oidcSecurityValidation.getPayloadFromToken(id_token, false);

        return new Observable<boolean>(observer => {
            // flow id_token token
            if (this.authConfiguration.response_type === 'id_token token') {
                if (isRenewProcess) {
                    this.oidcSecurityCommon.sessionState = result.session_state;
                    observer.next(true);
                    observer.complete();
                } else {
                    this.oidcSecurityUserService.initUserData()
                        .subscribe(() => {
                            this.oidcSecurityCommon.logDebug('authorizedCallback id_token token flow');
                            if (this.oidcSecurityValidation.validate_userdata_sub_id_token(decoded_id_token.sub, this.oidcSecurityUserService.userData.sub)) {
                                this.setUserData(this.oidcSecurityUserService.userData);
                                this.oidcSecurityCommon.logDebug(this.oidcSecurityCommon.accessToken);
                                this.oidcSecurityCommon.logDebug(this.oidcSecurityUserService.userData);

                                this.oidcSecurityCommon.sessionState = result.session_state;

                                this.runTokenValidation();
                                observer.next(true);
                            } else { // something went wrong, userdata sub does not match that from id_token
                                this.oidcSecurityCommon.logWarning('authorizedCallback, User data sub does not match sub in id_token');
                                this.oidcSecurityCommon.logDebug('authorizedCallback, token(s) validation failed, resetting');
                                this.resetAuthorizationData(false);
                                observer.next(false);
                            }
                            observer.complete();
                        });
                }
            } else { // flow id_token
                this.oidcSecurityCommon.logDebug('authorizedCallback id_token flow');
                this.oidcSecurityCommon.logDebug(this.oidcSecurityCommon.accessToken);

                // userData is set to the id_token decoded. No access_token.
                this.oidcSecurityUserService.userData = decoded_id_token;
                this.setUserData(this.oidcSecurityUserService.userData);

                this.oidcSecurityCommon.sessionState = result.session_state;

                if (!isRenewProcess) {
                    this.runTokenValidation();
                }

                observer.next(true);
                observer.complete();
            }
        });
    }

    logoff() {
        // /connect/endsession?id_token_hint=...&post_logout_redirect_uri=https://myapp.com
        this.oidcSecurityCommon.logDebug('BEGIN Authorize, no auth data');

        this.resetAuthorizationData(false);
        const eventId = this.getNextEventId();
        this.triggerEvent(new AuthenticationLogout(eventId));

        if (this.authWellKnownEndpoints.end_session_endpoint) {
            let end_session_endpoint = this.authWellKnownEndpoints.end_session_endpoint;
            let id_token_hint = this.oidcSecurityCommon.idToken;
            let url = this.createEndSessionUrl(end_session_endpoint, id_token_hint);

            if (!this.authConfiguration.start_checksession || !this.checkSessionChanged) {
                window.location.href = url;
                return;
            }
        }

        this.oidcSecurityCommon.logDebug('only local login cleaned up, no end_session_endpoint');
    }

    private successful_validation() {
        this.oidcSecurityCommon.authNonce = '';

        if (this.authConfiguration.auto_clean_state_after_authentication) {
            this.oidcSecurityCommon.authStateControl = '';
        }
        this.oidcSecurityCommon.logDebug('AuthorizedCallback token(s) validated, continue');
    }

    private refreshSession() {
        this.oidcSecurityCommon.logDebug('BEGIN refresh session Authorize');

        let state = this.oidcSecurityCommon.authStateControl;
        if (state === '' || state === null) {
            state = Date.now() + '' + Math.random();
            this.oidcSecurityCommon.authStateControl = state;
        }

        let nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.authNonce = nonce;
        this.oidcSecurityCommon.logDebug('RefreshSession created. adding myautostate: ' + this.oidcSecurityCommon.authStateControl);

        let url = this.createAuthorizeUrl(nonce, state, this.authWellKnownEndpoints.authorization_endpoint);

        this.oidcSecurityCommon.silentRenewRunning = 'running';
        this.oidcSecuritySilentRenew.startRenew(url);
    }

    private setAuthorizationData(access_token: any, id_token: any) {
        if (this.oidcSecurityCommon.accessToken !== '') {
            this.oidcSecurityCommon.accessToken = '';
        }

        this.oidcSecurityCommon.logDebug(access_token);
        this.oidcSecurityCommon.logDebug(id_token);
        this.oidcSecurityCommon.logDebug('storing to storage, getting the roles');
        this.oidcSecurityCommon.accessToken = access_token;
        this.oidcSecurityCommon.idToken = id_token;
        this.setIsAuthorized(true);
        this.oidcSecurityCommon.isAuthorized = true;
    }

    private createAuthorizeUrl(nonce: string, state: string, authorization_endpoint: string): string {

        let urlParts = authorization_endpoint.split('?');
        let authorizationUrl = urlParts[0];
        let params = new HttpParams({ fromString: urlParts[1], encoder: new UriEncoder() });
        params = params.set('client_id', this.authConfiguration.client_id);
        params = params.append('redirect_uri', this.authConfiguration.redirect_url);
        params = params.append('response_type', this.authConfiguration.response_type);
        params = params.append('scope', this.authConfiguration.scope);
        params = params.append('nonce', nonce);
        params = params.append('state', state);
        if (this.authConfiguration.hd_param) {
            params = params.append('hd', this.authConfiguration.hd_param);
        }

        let customParams = Object.assign({}, this.oidcSecurityCommon.customRequestParams);

        Object.keys(customParams).forEach(key => {
            params = params.append(key, customParams[key].toString());
        });

        return `${authorizationUrl}?${params}`;
    }

    private createEndSessionUrl(end_session_endpoint: string, id_token_hint: string) {
        let urlParts = end_session_endpoint.split('?');

        let authorizationEndsessionUrl = urlParts[0];

        let params = new HttpParams({ fromString: urlParts[1], encoder: new UriEncoder() });
        params = params.set('id_token_hint', id_token_hint);
        params = params.append('post_logout_redirect_uri', this.authConfiguration.post_logout_redirect_uri);

        return `${authorizationEndsessionUrl}?${params}`;
    }

    private resetAuthorizationData(isRenewProcess: boolean) {
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

    // WARNING: Remove this? (never called!)
    handleError(error: any) {
        this.oidcSecurityCommon.logError(error);
        if (error.status == 403) {
            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
            } else {
                // WARNING: Only usage of authConfiguration.forbidden_route (never called!)
                this.router.navigate([this.authConfiguration.forbidden_route]);
            }
        } else if (error.status == 401) {
            let silentRenew = this.oidcSecurityCommon.silentRenewRunning;
            this.resetAuthorizationData(silentRenew !== '');
            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
            } else {
                this.router.navigate([this.authConfiguration.unauthorized_route]);
            }
        }
    }

    private onCheckSessionChanged() {
        this.oidcSecurityCommon.logDebug('onCheckSessionChanged');
        this.checkSessionChanged = true;
    }

    private onWellKnownEndpointsLoaded() {
        this.oidcSecurityCommon.logDebug('onWellKnownEndpointsLoaded');
        this.authWellKnownEndpointsLoaded = true;
    }

    private onUserDataChanged() {
        this.oidcSecurityCommon.logDebug(`onUserDataChanged: last = ${this.lastUserData}, new = ${this._userData.value}`);

        if (this.lastUserData && !this._userData.value) {
            this.oidcSecurityCommon.logDebug('onUserDataChanged: Logout detected.');
            // TODO should we have an action here
        }
        this.lastUserData = this._userData.value;
    }

    private getSigningKeys(): Observable<JwtKeys> {
        this.oidcSecurityCommon.logDebug('jwks_uri: ' + this.authWellKnownEndpoints.jwks_uri);
        return this.http.get<JwtKeys>(this.authWellKnownEndpoints.jwks_uri)
            .catch(this.handleErrorGetSigningKeys);
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
        return Observable.throw(errMsg);
    }

    private runTokenValidation() {
        if (this.runTokenValidationRunning) {
            return;
        }
        this.runTokenValidationRunning = true;
        let source = Observable.timer(5000, 3000)
            .timeInterval()
            .pluck('interval')
            .take(10000);

        let eventId: number;
        source.subscribe(() => {
            if (this._userData.value) {
                if (this.oidcSecurityValidation.isTokenExpired(this.oidcSecurityCommon.idToken, this.authConfiguration.silent_renew_offset_in_seconds)) {
                    eventId = this.getNextEventId();
                    this.triggerEvent(new RefreshTokenExpired(eventId));
                    this.oidcSecurityCommon.logDebug('IsAuthorized: id_token isTokenExpired, start silent renew if active');

                    console.log('getNextEventId: runTokenValidation', eventId);
                    if (this.authConfiguration.silent_renew) {
                        this.triggerEvent(new RefreshTokenStart(eventId));
                        this.refreshSession();
                    } else {
                        this.resetAuthorizationData(false);
                        this.triggerEvent(new AuthenticationLogout(eventId));
                    }
                }
            }
        },
            (err: any) => {
                this.triggerEvent(new RefreshTokenError(eventId, err));
                this.oidcSecurityCommon.logError('Error: ' + err);
            },
            () => {
                this.triggerEvent(new RefreshTokenSuccess(eventId));
                this.oidcSecurityCommon.logDebug('Completed');
            });
    }
}
