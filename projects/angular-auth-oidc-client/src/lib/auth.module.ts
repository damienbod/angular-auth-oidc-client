import { NgModule } from '@angular/core';
import { OidcDataService } from './api/oidc-data.service';
import { OidcSecurityCheckSession } from './check-session/oidc.security.check-session';
import { OidcConfigService } from './config';
import { LoggerService } from './logging/logger.service';
import { IFrameService } from './services/existing-iframe.service';
import { TokenHelperService } from './services/oidc-token-helper.service';
import { OidcSecurityService } from './services/oidc.security.service';
import { OidcSecuritySilentRenew } from './services/oidc.security.silent-renew';
import { OidcSecurityUserService } from './services/oidc.security.user-service';
import { AbstractSecurityStorage, BrowserStorageService, StoragePersistanceService } from './storage';
import { EqualityService } from './utils/equality/equality.service';
import { StateValidationService } from './validation/state-validation.service';
import { TokenValidationService } from './validation/token-validation.service';

@NgModule()
export class AuthModule {
    static forRoot(token: Token = {}) {
        return {
            ngModule: AuthModule,
            providers: [
                OidcConfigService,
                OidcSecurityService,
                TokenValidationService,
                OidcSecurityCheckSession,
                OidcSecuritySilentRenew,
                OidcSecurityUserService,
                StoragePersistanceService,
                TokenHelperService,
                LoggerService,
                IFrameService,
                EqualityService,
                OidcDataService,
                StateValidationService,
                {
                    provide: AbstractSecurityStorage,
                    useClass: token.storage || BrowserStorageService,
                },
            ],
        };
    }
}

export type Type<T> = new (...args: any[]) => T;

export interface Token {
    storage?: Type<any>;
}
