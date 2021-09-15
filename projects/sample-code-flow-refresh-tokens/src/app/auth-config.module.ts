import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          authority: 'https://login.microsoftonline.com/94999c36-9100-4153-9cbc-ddce798f5c95/v2.0/.well-known/openid-configuration', ///94999c36-9100-4153-9cbc-ddce798f5c95/oauth2/v2.0
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'bf171d26-c5df-4da7-b2e6-d30f39c11863',
          scope: 'openid profile',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          logLevel: LogLevel.Debug,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false,
          autoUserInfo: false,
          customParamsAuthRequest: {
            prompt: 'select_account', // login, consent
          },
        },

      ],
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {
}
