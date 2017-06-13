var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, EventEmitter, Output } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Rx';
import { Router } from '@angular/router';
import { AuthConfiguration } from '../auth.configuration';
import { OidcSecurityValidation } from './oidc.security.validation';
import { OidcSecurityCheckSession } from './oidc.security.check-session';
import { OidcSecuritySilentRenew } from './oidc.security.silent-renew';
import { OidcSecurityUserService } from './oidc.security.user-service';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
var OidcSecurityService = (function () {
    function OidcSecurityService(http, authConfiguration, router, oidcSecurityCheckSession, oidcSecuritySilentRenew, oidcSecurityUserService, oidcSecurityCommon, authWellKnownEndpoints) {
        var _this = this;
        this.http = http;
        this.authConfiguration = authConfiguration;
        this.router = router;
        this.oidcSecurityCheckSession = oidcSecurityCheckSession;
        this.oidcSecuritySilentRenew = oidcSecuritySilentRenew;
        this.oidcSecurityUserService = oidcSecurityUserService;
        this.oidcSecurityCommon = oidcSecurityCommon;
        this.authWellKnownEndpoints = authWellKnownEndpoints;
        this.onUserDataLoaded = new EventEmitter(true);
        this.oidcSecurityValidation = new OidcSecurityValidation(this.oidcSecurityCommon);
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');
        this.headers.append('Accept', 'application/json');
        if (this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_is_authorized) !== '') {
            this.isAuthorized = this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_is_authorized);
        }
        this.oidcSecurityCheckSession.onCheckSessionChanged.subscribe(function () { _this.onCheckSessionChanged(); });
    }
    OidcSecurityService.prototype.getToken = function () {
        return this.oidcSecurityCommon.getAccessToken();
    };
    OidcSecurityService.prototype.getUserData = function () {
        if (!this.isAuthorized) {
            this.oidcSecurityCommon.logError('User must be logged in before you can get the user data!');
        }
        return this.oidcSecurityUserService.userData;
    };
    OidcSecurityService.prototype.authorize = function () {
        this.resetAuthorizationData();
        this.oidcSecurityCommon.logDebug('BEGIN Authorize, no auth data');
        var nonce = 'N' + Math.random() + '' + Date.now();
        var state = Date.now() + '' + Math.random();
        this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_auth_state_control, state);
        this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_auth_nonce, nonce);
        this.oidcSecurityCommon.logDebug('AuthorizedController created. local state: ' + this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_auth_state_control));
        var url = this.createAuthorizeUrl(nonce, state);
        window.location.href = url;
    };
    OidcSecurityService.prototype.authorizedCallback = function () {
        var _this = this;
        this.oidcSecurityCommon.logDebug('BEGIN AuthorizedCallback, no auth data');
        this.resetAuthorizationData();
        var hash = window.location.hash.substr(1);
        var result = hash.split('&').reduce(function (result, item) {
            var parts = item.split('=');
            result[parts[0]] = parts[1];
            return result;
        }, {});
        this.oidcSecurityCommon.logDebug(result);
        this.oidcSecurityCommon.logDebug('AuthorizedCallback created, begin token validation');
        var token = '';
        var id_token = '';
        var authResponseIsValid = false;
        this.getSigningKeys()
            .subscribe(function (jwtKeys) {
            _this.jwtKeys = jwtKeys;
            if (!result.error) {
                if (_this.oidcSecurityValidation.validateStateFromHashCallback(result.state, _this.oidcSecurityCommon.retrieve(_this.oidcSecurityCommon.storage_auth_state_control))) {
                    token = result.access_token;
                    id_token = result.id_token;
                    var decoded_id_token = void 0;
                    var headerDecoded = void 0;
                    decoded_id_token = _this.oidcSecurityValidation.getPayloadFromToken(id_token, false);
                    headerDecoded = _this.oidcSecurityValidation.getHeaderFromToken(id_token, false);
                    if (_this.oidcSecurityValidation.validate_signature_id_token(id_token, _this.jwtKeys)) {
                        if (_this.oidcSecurityValidation.validate_id_token_nonce(decoded_id_token, _this.oidcSecurityCommon.retrieve(_this.oidcSecurityCommon.storage_auth_nonce))) {
                            if (_this.oidcSecurityValidation.validate_required_id_token(decoded_id_token)) {
                                if (_this.oidcSecurityValidation.validate_id_token_iat_max_offset(decoded_id_token, _this.authConfiguration.max_id_token_iat_offset_allowed_in_seconds)) {
                                    if (_this.oidcSecurityValidation.validate_id_token_iss(decoded_id_token, _this.authWellKnownEndpoints.issuer)) {
                                        if (_this.oidcSecurityValidation.validate_id_token_aud(decoded_id_token, _this.authConfiguration.client_id)) {
                                            if (_this.oidcSecurityValidation.validate_id_token_exp_not_expired(decoded_id_token)) {
                                                if (_this.oidcSecurityValidation.validate_id_token_at_hash(token, decoded_id_token.at_hash) || !token) {
                                                    _this.oidcSecurityCommon.store(_this.oidcSecurityCommon.storage_auth_nonce, '');
                                                    _this.oidcSecurityCommon.store(_this.oidcSecurityCommon.storage_auth_state_control, '');
                                                    authResponseIsValid = true;
                                                    _this.oidcSecurityCommon.logDebug('AuthorizedCallback id_token, access_token validated, returning token');
                                                }
                                                else {
                                                    _this.oidcSecurityCommon.logWarning('AuthorizedCallback incorrect aud');
                                                }
                                            }
                                            else {
                                                _this.oidcSecurityCommon.logWarning('AuthorizedCallback token expired');
                                            }
                                        }
                                        else {
                                            _this.oidcSecurityCommon.logWarning('AuthorizedCallback incorrect aud');
                                        }
                                    }
                                    else {
                                        _this.oidcSecurityCommon.logWarning('AuthorizedCallback incorrect iss');
                                    }
                                }
                                else {
                                    _this.oidcSecurityCommon.logWarning('Validation, iat rejected id_token was issued too far away from the current time');
                                }
                            }
                            else {
                                _this.oidcSecurityCommon.logDebug('Validation, one of the REQUIRED properties missing from id_token');
                            }
                        }
                        else {
                            _this.oidcSecurityCommon.logWarning('AuthorizedCallback incorrect nonce');
                        }
                    }
                    else {
                        _this.oidcSecurityCommon.logWarning('AuthorizedCallback incorrect Signature id_token');
                    }
                }
                else {
                    _this.oidcSecurityCommon.logWarning('AuthorizedCallback incorrect state');
                }
            }
            if (authResponseIsValid) {
                _this.setAuthorizationData(token, id_token);
                _this.oidcSecurityUserService.initUserData()
                    .subscribe(function () {
                    _this.onUserDataLoaded.emit();
                    _this.oidcSecurityCommon.logDebug(_this.oidcSecurityCommon.retrieve(_this.oidcSecurityCommon.storage_access_token));
                    _this.oidcSecurityCommon.logDebug(_this.oidcSecurityUserService.userData);
                    if (_this.authConfiguration.start_checksession) {
                        _this.oidcSecurityCheckSession.init().subscribe(function () {
                            _this.oidcSecurityCheckSession.pollServerSession(result.session_state, _this.authConfiguration.client_id);
                        });
                    }
                    if (_this.authConfiguration.silent_renew) {
                        _this.oidcSecuritySilentRenew.initRenew();
                    }
                    _this.runTokenValidatation();
                    _this.router.navigate([_this.authConfiguration.startup_route]);
                });
            }
            else {
                _this.resetAuthorizationData();
                _this.router.navigate([_this.authConfiguration.unauthorized_route]);
            }
        });
    };
    OidcSecurityService.prototype.logoff = function () {
        this.oidcSecurityCommon.logDebug('BEGIN Authorize, no auth data');
        var authorizationEndsessionUrl = this.authWellKnownEndpoints.end_session_endpoint;
        var id_token_hint = this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_id_token);
        var post_logout_redirect_uri = this.authConfiguration.post_logout_redirect_uri;
        var url = authorizationEndsessionUrl + '?' +
            'id_token_hint=' + encodeURI(id_token_hint) + '&' +
            'post_logout_redirect_uri=' + encodeURI(post_logout_redirect_uri);
        this.resetAuthorizationData();
        if (this.authConfiguration.start_checksession && this.checkSessionChanged) {
            this.oidcSecurityCommon.logDebug('only local login cleaned up, server session has changed');
        }
        else {
            window.location.href = url;
        }
    };
    OidcSecurityService.prototype.refreshSession = function () {
        this.oidcSecurityCommon.logDebug('BEGIN refresh session Authorize');
        var nonce = 'N' + Math.random() + '' + Date.now();
        var state = Date.now() + '' + Math.random();
        this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_auth_state_control, state);
        this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_auth_nonce, nonce);
        this.oidcSecurityCommon.logDebug('RefreshSession created. adding myautostate: ' + this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_auth_state_control));
        var url = this.createAuthorizeUrl(nonce, state);
        this.oidcSecuritySilentRenew.startRenew(url);
    };
    OidcSecurityService.prototype.setAuthorizationData = function (access_token, id_token) {
        if (this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_access_token) !== '') {
            this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_access_token, '');
        }
        this.oidcSecurityCommon.logDebug(access_token);
        this.oidcSecurityCommon.logDebug(id_token);
        this.oidcSecurityCommon.logDebug('storing to storage, getting the roles');
        this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_access_token, access_token);
        this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_id_token, id_token);
        this.isAuthorized = true;
        this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_is_authorized, true);
    };
    OidcSecurityService.prototype.createAuthorizeUrl = function (nonce, state) {
        var authorizationUrl = this.authWellKnownEndpoints.authorization_endpoint;
        var client_id = this.authConfiguration.client_id;
        var redirect_uri = this.authConfiguration.redirect_url;
        var response_type = this.authConfiguration.response_type;
        var scope = this.authConfiguration.scope;
        var url = authorizationUrl + '?' +
            'response_type=' + encodeURI(response_type) + '&' +
            'client_id=' + encodeURI(client_id) + '&' +
            'redirect_uri=' + encodeURI(redirect_uri) + '&' +
            'scope=' + encodeURI(scope) + '&' +
            'nonce=' + encodeURI(nonce) + '&' +
            'state=' + encodeURI(state);
        return url;
    };
    OidcSecurityService.prototype.resetAuthorizationData = function () {
        this.isAuthorized = false;
        this.oidcSecurityCommon.resetStorageData();
        this.checkSessionChanged = false;
    };
    OidcSecurityService.prototype.handleError = function (error) {
        this.oidcSecurityCommon.logError(error);
        if (error.status == 403) {
            this.router.navigate([this.authConfiguration.forbidden_route]);
        }
        else if (error.status == 401) {
            this.resetAuthorizationData();
            this.router.navigate([this.authConfiguration.unauthorized_route]);
        }
    };
    OidcSecurityService.prototype.onCheckSessionChanged = function () {
        this.oidcSecurityCommon.logDebug('onCheckSessionChanged');
        this.checkSessionChanged = true;
    };
    OidcSecurityService.prototype.runGetSigningKeys = function () {
        var _this = this;
        this.getSigningKeys()
            .subscribe(function (jwtKeys) { return _this.jwtKeys = jwtKeys; }, function (error) { return _this.errorMessage = error; });
    };
    OidcSecurityService.prototype.getSigningKeys = function () {
        this.oidcSecurityCommon.logDebug('jwks_uri: ' + this.authWellKnownEndpoints.jwks_uri);
        return this.http.get(this.authWellKnownEndpoints.jwks_uri)
            .map(this.extractData)
            .catch(this.handleErrorGetSigningKeys);
    };
    OidcSecurityService.prototype.extractData = function (res) {
        var body = res.json();
        return body;
    };
    OidcSecurityService.prototype.handleErrorGetSigningKeys = function (error) {
        var errMsg;
        if (error instanceof Response) {
            var body = error.json() || '';
            var err = body.error || JSON.stringify(body);
            errMsg = error.status + " - " + (error.statusText || '') + " " + err;
        }
        else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Observable.throw(errMsg);
    };
    OidcSecurityService.prototype.runTokenValidatation = function () {
        var _this = this;
        var source = Observable.timer(3000, 3000)
            .timeInterval()
            .pluck('interval')
            .take(10000);
        var subscription = source.subscribe(function () {
            if (_this.isAuthorized) {
                if (_this.oidcSecurityValidation.isTokenExpired(_this.oidcSecurityCommon.retrieve(_this.oidcSecurityCommon.storage_id_token))) {
                    _this.oidcSecurityCommon.logDebug('IsAuthorized: id_token isTokenExpired, start silent renew if active');
                    if (_this.authConfiguration.silent_renew) {
                        _this.refreshSession();
                    }
                    else {
                        _this.resetAuthorizationData();
                    }
                }
            }
        }, function (err) {
            _this.oidcSecurityCommon.logError('Error: ' + err);
        }, function () {
            _this.oidcSecurityCommon.logDebug('Completed');
        });
    };
    return OidcSecurityService;
}());
__decorate([
    Output(),
    __metadata("design:type", EventEmitter)
], OidcSecurityService.prototype, "onUserDataLoaded", void 0);
OidcSecurityService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Http,
        AuthConfiguration,
        Router,
        OidcSecurityCheckSession,
        OidcSecuritySilentRenew,
        OidcSecurityUserService,
        OidcSecurityCommon,
        AuthWellKnownEndpoints])
], OidcSecurityService);
export { OidcSecurityService };
//# sourceMappingURL=oidc.security.service.js.map