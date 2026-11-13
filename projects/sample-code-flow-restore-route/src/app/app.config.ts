import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
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
          authority: 'https://offeringsolutions-sts.azurewebsites.net',
          clientId: 'angularCodeRefreshTokens',
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
