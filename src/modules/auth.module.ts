import { NgModule, ModuleWithProviders, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Http, Response, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

import { OidcSecurityService } from './services/oidc.security.service';
import { AuthConfiguration } from './auth.configuration';
import { OidcSecurityValidation } from './services/oidc.security.validation';
import { OidcSecurityCheckSession } from './services/oidc.security.check-session';
import { OidcSecuritySilentRenew } from './services/oidc.security.silent-renew';
import { OidcSecurityUserService } from './services/oidc.security.user-service';
import { OidcSecurityCommon } from './services/oidc.security.common';
import { AuthWellKnownEndpoints } from './services/auth.well-known-endpoints';

@NgModule({
    imports: [
        CommonModule
    ]
})

export class AuthModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: AuthModule,
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
    }
}