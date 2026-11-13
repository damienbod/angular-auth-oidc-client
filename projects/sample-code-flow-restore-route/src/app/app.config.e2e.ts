import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  LogLevel,
  provideAuth,
  withAppInitializerAuthCheck,
} from 'angular-auth-oidc-client';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAuth(
      {
        config: {
          postLoginRoute: '/one',
          logLevel: LogLevel.Debug,
          authority: 'http://localhost:8081/idp1',
          clientId: 'client-idp1',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          scope: 'openid profile email offline_access',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
        },
      },
      withAppInitializerAuthCheck()
    ),
  ],
};
