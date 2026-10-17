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
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        // The test IdP issues tokens valid for 300 seconds. Renewing 290 seconds
        // before expiry makes the refresh-token renew kick in after ~10 seconds.
        renewTimeBeforeTokenExpiresInSeconds: 290,
        logLevel: LogLevel.Debug,
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
