import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        stsServer: 'https://login.microsoftonline.com/damienbod.onmicrosoft.com/v2.0',
        authWellknownEndpointUrl:
          'https://damienbod.b2clogin.com/damienbod.onmicrosoft.com/B2C_1_b2cpolicydamien/v2.0/.well-known/openid-configuration',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
        scope: 'openid https://damienbod.onmicrosoft.com/testapi/demo.read',
        responseType: 'code',
        silentRenew: true,
        autoUserInfo: false,
        silentRenewUrl: window.location.origin + '/silent-renew.html',
        logLevel: LogLevel.Debug,
        renewTimeBeforeTokenExpiresInSeconds: 60,
        // useRefreshToken: true, // for refresh renew, but revocation and one time usage is missing from server impl.
        // ignoreNonceAfterRefresh: true,
        // disableRefreshIdTokenAuthTimeValidation: true,
        customParamsAuthRequest: {
          prompt: 'select_account', // login, consent
        },
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
