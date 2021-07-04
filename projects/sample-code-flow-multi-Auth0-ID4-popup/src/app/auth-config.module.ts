import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          authority: 'https://offeringsolutions-sts.azurewebsites.net',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'angularCodeRefreshTokens',
          scope: 'openid profile email taler_api offline_access',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          logLevel: LogLevel.Debug,
        },
        {
          authority: 'https://dev-damienbod.eu.auth0.com',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'Ujh5oSBAFr1BuilgkZPcMWEgnuREgrwU',
          scope: 'openid profile offline_access auth0-user-api-spa',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          logLevel: LogLevel.Debug,
          customParamsAuthRequest: {
            audience: 'https://auth0-api-spa',
          },
          customParamsRefreshTokenRequest: {
            scope: 'openid profile offline_access auth0-user-api-spa',
          },
        },
      ],
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
