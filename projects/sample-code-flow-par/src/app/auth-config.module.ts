import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: 'http://localhost:3000',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        // clientId: 'getAuthorizeParUrl', // code flow
        clientId: 'client-par-required', // code flow par
        usePushedAuthorisationRequests: true, // use par Pushed Authorisation Requests
        scope: 'openid profile offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        logLevel: LogLevel.Debug,
        ignoreNonceAfterRefresh: true,
        customParamsAuthRequest: {
          prompt: 'consent', // login, consent
        },
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
