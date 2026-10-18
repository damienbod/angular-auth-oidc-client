import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

// Swapped in for auth-config.module.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: 'http://localhost:8081/idp1',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'client-idp1',
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
