import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import {
  authInterceptor,
  LogLevel,
  provideAuth,
  withAppInitializerAuthCheck,
} from 'angular-auth-oidc-client';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideAuth(
      {
        config: {
          authority:
            'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
          authWellknownEndpointUrl:
            'https://login.microsoftonline.com/common/v2.0',
          redirectUrl: window.location.origin,
          clientId: 'e38ea64a-2962-4cde-bfe7-dd2822fdab32',
          scope:
            'openid profile offline_access email api://e38ea64a-2962-4cde-bfe7-dd2822fdab32/access_as_user',
          responseType: 'code',
          silentRenew: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: true,
          autoUserInfo: false,
          strictIssuerValidationOnWellKnownRetrievalOff: true,
          // silentRenewUrl: window.location.origin + '/silent-renew.html',
          useRefreshToken: true,
          logLevel: LogLevel.Debug,
          customParamsAuthRequest: {
            prompt: 'select_account', // login, consent
          },
        },
      },
      withAppInitializerAuthCheck()
    ),
    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([authInterceptor()])
    ),
  ],
};
