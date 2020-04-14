import { NgModule } from '@angular/core';
import { OidcDataService } from './api/oidc-data.service';
import { OidcConfigService } from './config';
import { IFrameService } from './services/existing-iframe.service';
import { EqualityHelperService } from './services/oidc-equality-helper.service';
import { StateValidationService } from './services/oidc-security-state-validation.service';
import { TokenHelperService } from './services/oidc-token-helper.service';
import { LoggerService } from './services/oidc.logger.service';
import { OidcSecurityCheckSession } from './services/oidc.security.check-session';
import { OidcSecurityCommon } from './services/oidc.security.common';
import { OidcSecurityService } from './services/oidc.security.service';
import { OidcSecuritySilentRenew } from './services/oidc.security.silent-renew';
import { BrowserStorage, OidcSecurityStorage } from './services/oidc.security.storage';
import { OidcSecurityUserService } from './services/oidc.security.user-service';
import { OidcSecurityValidation } from './services/oidc.security.validation';

@NgModule()
export class AuthModule {
    static forRoot(token: Token = {}) {
        return {
            ngModule: AuthModule,
            providers: [
                OidcConfigService,
                OidcSecurityService,
                OidcSecurityValidation,
                OidcSecurityCheckSession,
                OidcSecuritySilentRenew,
                OidcSecurityUserService,
                OidcSecurityCommon,
                TokenHelperService,
                LoggerService,
                IFrameService,
                EqualityHelperService,
                OidcDataService,
                StateValidationService,
                {
                    provide: OidcSecurityStorage,
                    useClass: token.storage || BrowserStorage,
                },
            ],
        };
    }
}

export type Type<T> = new (...args: any[]) => T;

export interface Token {
    storage?: Type<any>;
}
