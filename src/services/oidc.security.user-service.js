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
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
var OidcSecurityUserService = (function () {
    function OidcSecurityUserService(http, authConfiguration, oidcSecurityCommon, authWellKnownEndpoints) {
        var _this = this;
        this.http = http;
        this.authConfiguration = authConfiguration;
        this.oidcSecurityCommon = oidcSecurityCommon;
        this.authWellKnownEndpoints = authWellKnownEndpoints;
        this.getIdentityUserData = function () {
            var headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Accept', 'application/json');
            var token = _this.oidcSecurityCommon.getAccessToken();
            if (token !== '') {
                headers.append('Authorization', 'Bearer ' + token);
            }
            return _this.http.get(_this.authWellKnownEndpoints.userinfo_endpoint, {
                headers: headers,
                body: ''
            }).map(function (res) { return res.json(); });
        };
        if (this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_user_data) !== '') {
            this.userData = this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_user_data);
        }
    }
    OidcSecurityUserService.prototype.initUserData = function () {
        var _this = this;
        return this.getIdentityUserData()
            .map(function (data) { return _this.userData = data; });
    };
    OidcSecurityUserService.prototype.handleError = function (error) {
        this.oidcSecurityCommon.logError(error);
    };
    return OidcSecurityUserService;
}());
OidcSecurityUserService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Http,
        AuthConfiguration,
        OidcSecurityCommon,
        AuthWellKnownEndpoints])
], OidcSecurityUserService);
export { OidcSecurityUserService };
//# sourceMappingURL=oidc.security.user-service.js.map