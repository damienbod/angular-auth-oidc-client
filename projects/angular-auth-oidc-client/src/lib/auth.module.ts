import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { DataService } from './api/data.service';
import { HttpBaseService } from './api/http-base.service';
import { AuthStateService } from './authState/auth-state.service';
import { ImplicitFlowCallbackService } from './callback/implicit-flow-callback.service';
import { CheckAuthService } from './check-auth.service';
import { ConfigValidationService } from './config-validation/config-validation.service';
import { AuthWellKnownDataService } from './config/auth-well-known-data.service';
import { AuthWellKnownService } from './config/auth-well-known.service';
import { ConfigurationProvider } from './config/config.provider';
import { OidcConfigService } from './config/config.service';
import { HistoryJwtKeysCallbackHandlerService } from './flows/callback-handling/history-jwt-keys-callback-handler.service';
import { UserCallbackHandlerService } from './flows/callback-handling/user-callback-handler.service';
import { FlowsDataService } from './flows/flows-data.service';
import { FlowsService } from './flows/flows.service';
import { RandomService } from './flows/random/random.service';
import { ResetAuthDataService } from './flows/reset-auth-data.service';
import { SigninKeyDataService } from './flows/signin-key-data.service';
import { CheckSessionService } from './iframe/check-session.service';
import { IFrameService } from './iframe/existing-iframe.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { LoggerService } from './logging/logger.service';
import { LoginService } from './login/login.service';
import { ResponseTypeValidationService } from './login/response-type-validation.service';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { OidcSecurityService } from './oidc.security.service';
import { PublicEventsService } from './public-events/public-events.service';
import { AbstractSecurityStorage } from './storage/abstract-security-storage';
import { BrowserStorageService } from './storage/browser-storage.service';
import { StoragePersistanceService } from './storage/storage-persistance.service';
import { UserService } from './userData/user-service';
import { EqualityService } from './utils/equality/equality.service';
import { FlowHelper } from './utils/flowHelper/flow-helper.service';
import { PlatformProvider } from './utils/platform-provider/platform.provider';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { UrlService } from './utils/url/url.service';
import { StateValidationService } from './validation/state-validation.service';
import { TokenValidationService } from './validation/token-validation.service';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  declarations: [],
  exports: [],
})
export class AuthModule {
  static forRoot(token: Token = {}) {
    return {
      ngModule: AuthModule,
      providers: [
        OidcConfigService,
        PublicEventsService,
        FlowHelper,
        OidcSecurityService,
        TokenValidationService,
        PlatformProvider,
        CheckSessionService,
        FlowsDataService,
        FlowsService,
        SilentRenewService,
        ConfigurationProvider,
        LogoffRevocationService,
        UserService,
        RandomService,
        HttpBaseService,
        UrlService,
        AuthStateService,
        SigninKeyDataService,
        StoragePersistanceService,
        TokenHelperService,
        LoggerService,
        IFrameService,
        EqualityService,
        LoginService,
        AuthWellKnownDataService,
        AuthWellKnownService,
        DataService,
        StateValidationService,
        ConfigValidationService,
        CheckAuthService,
        ResetAuthDataService,
        ImplicitFlowCallbackService,
        HistoryJwtKeysCallbackHandlerService,
        ResponseTypeValidationService,
        UserCallbackHandlerService,
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
