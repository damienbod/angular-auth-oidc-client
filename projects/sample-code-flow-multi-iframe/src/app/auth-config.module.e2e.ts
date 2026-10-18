import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

// Swapped in for auth-config.module.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
// Like the original, both configs use the same authority and client with a
// different scope, and renew through iframes (no refresh tokens).
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          authority: 'http://localhost:8081/idp1',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp1',
          scope: 'openid profile email',
          responseType: 'code',
          silentRenew: true,
          silentRenewUrl: `${window.location.origin}/silent-renew.html`,
          // The test IdP issues tokens valid for 300 seconds. Renewing 290 seconds
          // before expiry makes the iframe renew kick in after ~10 seconds.
          renewTimeBeforeTokenExpiresInSeconds: 290,
          logLevel: LogLevel.Debug,
        },
        {
          authority: 'http://localhost:8081/idp1',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp1',
          scope: 'openid profile',
          responseType: 'code',
          silentRenew: true,
          silentRenewUrl: `${window.location.origin}/silent-renew.html`,
          renewTimeBeforeTokenExpiresInSeconds: 290,
          logLevel: LogLevel.Debug,
        },
      ],
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
