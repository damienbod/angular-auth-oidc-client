import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  authInterceptor,
  LogLevel,
  provideAuth,
  withAppInitializerAuthCheck,
} from 'angular-auth-oidc-client';

import { routes } from './app.routes';

// Swapped in for app.config.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
// The Entra ID specific options are kept to exercise those code paths.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAuth(
      {
        config: {
          authority: 'http://localhost:8081/idp1',
          // Like the "common" endpoint of the original, without the
          // .well-known suffix, which the library appends.
          authWellknownEndpointUrl: 'http://localhost:8081/idp1',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp1',
          scope: 'openid profile offline_access email',
          responseType: 'code',
          silentRenew: true,
          // The test IdP issues tokens valid for 300 seconds. Renewing 290 seconds
          // before expiry makes the refresh-token renew kick in after ~10 seconds.
          renewTimeBeforeTokenExpiresInSeconds: 290,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: true,
          autoUserInfo: false,
          strictIssuerValidationOnWellKnownRetrievalOff: true,
          useRefreshToken: true,
          logLevel: LogLevel.Debug,
          customParamsAuthRequest: {
            prompt: 'select_account',
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
