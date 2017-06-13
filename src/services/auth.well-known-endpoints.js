var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import { AuthConfiguration } from '../auth.configuration';
import { OidcSecurityCommon } from './oidc.security.common';
var AuthWellKnownEndpoints = (function () {
    function AuthWellKnownEndpoints(http, authConfiguration, oidcSecurityCommon) {
        var _this = this;
        this.http = http;
        this.authConfiguration = authConfiguration;
        this.oidcSecurityCommon = oidcSecurityCommon;
        this.getWellKnownEndpoints = function () {
            var headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Accept', 'application/json');
            return _this.http.get(_this.authConfiguration.stsServer + '/.well-known/openid-configuration', {
                headers: headers,
                body: ''
            }).map(function (res) { return res.json(); });
        };
        var data = this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_well_known_endpoints);
        this.oidcSecurityCommon.logDebug(data);
        if (data && data !== '') {
            this.oidcSecurityCommon.logDebug('AuthWellKnownEndpoints already defined');
            this.issuer = data.issuer;
            this.jwks_uri = data.jwks_uri;
            this.authorization_endpoint = data.authorization_endpoint;
            this.token_endpoint = data.token_endpoint;
            this.userinfo_endpoint = data.userinfo_endpoint;
            this.end_session_endpoint = data.end_session_endpoint;
            if (data.check_session_iframe) {
                this.check_session_iframe = data.check_session_iframe;
            }
            ;
            if (data.revocation_endpoint) {
                this.revocation_endpoint = data.revocation_endpoint;
            }
            ;
            if (data.introspection_endpoint) {
                this.introspection_endpoint = data.introspection_endpoint;
            }
        }
        else {
            this.oidcSecurityCommon.logDebug('AuthWellKnownEndpoints first time, get from the server');
            this.getWellKnownEndpoints()
                .subscribe(function (data) {
                _this.issuer = data.issuer;
                _this.jwks_uri = data.jwks_uri;
                _this.authorization_endpoint = data.authorization_endpoint;
                _this.token_endpoint = data.token_endpoint;
                _this.userinfo_endpoint = data.userinfo_endpoint;
                _this.end_session_endpoint = data.end_session_endpoint;
                if (data.check_session_iframe) {
                    _this.check_session_iframe = data.check_session_iframe;
                }
                ;
                if (data.revocation_endpoint) {
                    _this.revocation_endpoint = data.revocation_endpoint;
                }
                ;
                if (data.introspection_endpoint) {
                    _this.introspection_endpoint = data.introspection_endpoint;
                }
                _this.oidcSecurityCommon.store(_this.oidcSecurityCommon.storage_well_known_endpoints, data);
                _this.oidcSecurityCommon.logDebug(data);
            });
        }
    }
    return AuthWellKnownEndpoints;
}());
AuthWellKnownEndpoints = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Http,
        AuthConfiguration,
        OidcSecurityCommon])
], AuthWellKnownEndpoints);
export { AuthWellKnownEndpoints };
//# sourceMappingURL=auth.well-known-endpoints.js.map