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
import { AuthConfiguration } from '../auth.configuration';
var OidcSecurityCommon = (function () {
    function OidcSecurityCommon(authConfiguration) {
        this.authConfiguration = authConfiguration;
        this.storage_access_token = 'authorizationData';
        this.storage_id_token = 'authorizationDataIdToken';
        this.storage_is_authorized = '_isAuthorized';
        this.storage_user_data = 'userData';
        this.storage_auth_nonce = 'authNonce';
        this.storage_auth_state_control = 'authStateControl';
        this.storage_well_known_endpoints = 'wellknownendpoints';
        this.storage = sessionStorage;
    }
    OidcSecurityCommon.prototype.retrieve = function (key) {
        var item = this.storage.getItem(key);
        if (item && item !== 'undefined') {
            return JSON.parse(this.storage.getItem(key));
        }
        return;
    };
    OidcSecurityCommon.prototype.store = function (key, value) {
        this.storage.setItem(key, JSON.stringify(value));
    };
    OidcSecurityCommon.prototype.resetStorageData = function () {
        this.store(this.storage_access_token, '');
        this.store(this.storage_id_token, '');
        this.store(this.storage_is_authorized, false);
        this.store(this.storage_user_data, '');
    };
    OidcSecurityCommon.prototype.getAccessToken = function () {
        return this.retrieve(this.storage_access_token);
    };
    OidcSecurityCommon.prototype.logError = function (message) {
        console.error(message);
    };
    OidcSecurityCommon.prototype.logWarning = function (message) {
        if (this.authConfiguration.log_console_warning_active) {
            console.warn(message);
        }
    };
    OidcSecurityCommon.prototype.logDebug = function (message) {
        if (this.authConfiguration.log_console_debug_active) {
            console.log(message);
        }
    };
    return OidcSecurityCommon;
}());
OidcSecurityCommon = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AuthConfiguration])
], OidcSecurityCommon);
export { OidcSecurityCommon };
//# sourceMappingURL=oidc.security.common.js.map