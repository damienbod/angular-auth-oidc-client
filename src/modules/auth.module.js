var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import 'rxjs/add/operator/map';
import { OidcSecurityService } from './services/oidc.security.service';
import { AuthConfiguration } from './auth.configuration';
import { OidcSecurityValidation } from './services/oidc.security.validation';
import { OidcSecurityCheckSession } from './services/oidc.security.check-session';
import { OidcSecuritySilentRenew } from './services/oidc.security.silent-renew';
import { OidcSecurityUserService } from './services/oidc.security.user-service';
import { OidcSecurityCommon } from './services/oidc.security.common';
import { AuthWellKnownEndpoints } from './services/auth.well-known-endpoints';
var AuthModule = AuthModule_1 = (function () {
    function AuthModule() {
    }
    AuthModule.forRoot = function () {
        return {
            ngModule: AuthModule_1,
            providers: [
                OidcSecurityService,
                OidcSecurityValidation,
                OidcSecurityCheckSession,
                OidcSecuritySilentRenew,
                OidcSecurityUserService,
                OidcSecurityCommon,
                AuthConfiguration,
                AuthWellKnownEndpoints
            ]
        };
    };
    return AuthModule;
}());
AuthModule = AuthModule_1 = __decorate([
    NgModule({
        imports: [
            CommonModule
        ]
    })
], AuthModule);
export { AuthModule };
var AuthModule_1;
//# sourceMappingURL=auth.module.js.map