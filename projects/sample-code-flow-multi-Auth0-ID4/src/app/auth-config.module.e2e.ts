import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

// Swapped in for auth-config.module.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
// The two configs use two different realms of the test IdP.
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
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
        {
          authority: 'http://localhost:8081/idp2',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp2',
          scope: 'openid profile offline_access auth0-user-api-spa',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          renewTimeBeforeTokenExpiresInSeconds: 290,
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
