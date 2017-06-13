import { NgModule, ModuleWithProviders, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Http, Response, Headers } from '@angular/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { OidcSecurityService } from '../services/oidc.security.service';
import { AuthConfiguration } from './auth.configuration';
import { OidcSecurityValidation } from '../services/oidc.security.validation';
import { OidcSecurityCheckSession } from '../services/oidc.security.check-session';
import { OidcSecuritySilentRenew } from '../services/oidc.security.silent-renew';
import { OidcSecurityUserService } from '../services/oidc.security.user-service';
import { OidcSecurityCommon } from '../services/oidc.security.common';
import { AuthWellKnownEndpoints } from '../services/auth.well-known-endpoints';

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

    public static forChild(): ModuleWithProviders {
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