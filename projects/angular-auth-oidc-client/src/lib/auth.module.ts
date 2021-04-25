import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, InjectionToken, ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { DataService } from './api/data.service';
import { HttpBaseService } from './api/http-base.service';
import { AuthStateService } from './authState/auth-state.service';
import { AutoLoginService } from './auto-login/auto-login-service';
import { ImplicitFlowCallbackService } from './callback/implicit-flow-callback.service';
import { CheckAuthService } from './check-auth.service';
import { ConfigValidationService } from './config-validation/config-validation.service';
import { AuthWellKnownDataService } from './config/auth-well-known-data.service';
import { AuthWellKnownEndpoints } from './config/auth-well-known-endpoints';
import { AuthWellKnownService } from './config/auth-well-known.service';
import { StsConfigLoader, StsConfigStaticLoader } from './config/config-loader';
import { ConfigurationProvider } from './config/config.provider';
import { OidcConfigService } from './config/config.service';
import { OpenIdConfiguration } from './config/openid-configuration';
import { CodeFlowCallbackHandlerService } from './flows/callback-handling/code-flow-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerService } from './flows/callback-handling/history-jwt-keys-callback-handler.service';
import { ImplicitFlowCallbackHandlerService } from './flows/callback-handling/implicit-flow-callback-handler.service';
import { RefreshSessionCallbackHandlerService } from './flows/callback-handling/refresh-session-callback-handler.service';
import { RefreshTokenCallbackHandlerService } from './flows/callback-handling/refresh-token-callback-handler.service';
import { StateValidationCallbackHandlerService } from './flows/callback-handling/state-validation-callback-handler.service';
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
import { ParLoginService } from './login/par/par-login.service';
import { ParService } from './login/par/par.service';
import { PopUpLoginService } from './login/popup/popup-login.service';
import { ResponseTypeValidationService } from './login/response-type-validation/response-type-validation.service';
import { StandardLoginService } from './login/standard/standard-login.service';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { OidcSecurityService } from './oidc.security.service';
import { PublicEventsService } from './public-events/public-events.service';
import { AbstractSecurityStorage } from './storage/abstract-security-storage';
import { BrowserStorageService } from './storage/browser-storage.service';
import { StoragePersistenceService } from './storage/storage-persistence.service';
import { UserService } from './userData/user-service';
import { EqualityService } from './utils/equality/equality.service';
import { FlowHelper } from './utils/flowHelper/flow-helper.service';
import { PlatformProvider } from './utils/platform-provider/platform.provider';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { UrlService } from './utils/url/url.service';
import { StateValidationService } from './validation/state-validation.service';
import { TokenValidationService } from './validation/token-validation.service';

export interface PassedInitialConfig {
  authWellKnown?: AuthWellKnownEndpoints;
  config?: OpenIdConfiguration;
  loader?: Provider;
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function createStaticLoader(passedConfig: PassedInitialConfig) {
  return new StsConfigStaticLoader(passedConfig.config);
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function configurationProviderFactory(
  oidcConfigService: OidcConfigService,
  loader: StsConfigLoader,
  passedConfig: PassedInitialConfig
) {
  const fn = () => loader.loadConfig().then((loadedConfig) => oidcConfigService.withConfig(loadedConfig, passedConfig.authWellKnown));

  return fn;
}

export const PASSED_CONFIG = new InjectionToken<PassedInitialConfig>('PASSED_CONFIG');

@NgModule({
  imports: [CommonModule, HttpClientModule],
  declarations: [],
  exports: [],
})
export class AuthModule {
  static forRoot(passedConfig: PassedInitialConfig): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
        // Make the PASSED_CONFIG available through injection
        { provide: PASSED_CONFIG, useValue: passedConfig },

        //Create the loader: Either the one getting passed or a static one
        passedConfig?.loader || { provide: StsConfigLoader, useFactory: createStaticLoader, deps: [PASSED_CONFIG] },

        // Load the config when the app starts
        {
          provide: APP_INITIALIZER,
          multi: true,
          deps: [OidcConfigService, StsConfigLoader, PASSED_CONFIG],
          useFactory: configurationProviderFactory,
        },
        {
          provide: AbstractSecurityStorage,
          useClass: (passedConfig?.config as OpenIdConfiguration)?.storage || BrowserStorageService,
        },
        OidcConfigService,
        PublicEventsService,
        FlowHelper,
        ConfigurationProvider,
        OidcSecurityService,
        TokenValidationService,
        PlatformProvider,
        CheckSessionService,
        FlowsDataService,
        FlowsService,
        SilentRenewService,
        LogoffRevocationService,
        UserService,
        RandomService,
        HttpBaseService,
        UrlService,
        AuthStateService,
        SigninKeyDataService,
        StoragePersistenceService,
        TokenHelperService,
        LoggerService,
        IFrameService,
        EqualityService,
        LoginService,
        ParService,
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
        StateValidationCallbackHandlerService,
        RefreshSessionCallbackHandlerService,
        RefreshTokenCallbackHandlerService,
        CodeFlowCallbackHandlerService,
        ImplicitFlowCallbackHandlerService,
        ParLoginService,
        PopUpLoginService,
        StandardLoginService,
        AutoLoginService,
      ],
    };
  }
}
