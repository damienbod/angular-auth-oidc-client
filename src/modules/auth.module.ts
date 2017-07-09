import { NgModule, ModuleWithProviders } from '@angular/core';

import { OidcSecurityService } from '../services/oidc.security.service';
import { AuthConfiguration, DefaultConfiguration } from './auth.configuration';
import { OidcSecurityValidation } from '../services/oidc.security.validation';
import { OidcSecurityCheckSession } from '../services/oidc.security.check-session';
import { OidcSecuritySilentRenew } from '../services/oidc.security.silent-renew';
import { OidcSecurityUserService } from '../services/oidc.security.user-service';
import { OidcSecurityCommon } from '../services/oidc.security.common';
import { OidcSecurityStorage, BrowserStorage } from '../services/oidc.security.storage';
import { AuthWellKnownEndpoints } from '../services/auth.well-known-endpoints';

@NgModule()
export class AuthModule {
    static forRoot(token: Token = {}): ModuleWithProviders {
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
                DefaultConfiguration,
                AuthWellKnownEndpoints,
                {
                    provide: OidcSecurityStorage,
                    useClass: token.storage || BrowserStorage
                }
            ]
        };
    }

    public static forChild(token: Token = {}): ModuleWithProviders {
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
                AuthWellKnownEndpoints,
                {
                    provide: OidcSecurityStorage,
                    useClass: token.storage || BrowserStorage
                }
            ]
        };
    }
}

export interface Type<T> extends Function {

    new (...args: any[]): T;

}

export interface Token {

    storage?: Type<any>;

}
