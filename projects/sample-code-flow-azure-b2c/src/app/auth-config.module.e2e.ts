import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

// Swapped in for auth-config.module.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
// The Azure B2C specific options are kept to exercise those code paths.
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: 'http://localhost:8081/idp1',
        authWellknownEndpointUrl:
          'http://localhost:8081/idp1/.well-known/openid-configuration',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'client-idp1',
        // The test IdP only issues refresh tokens for the offline_access scope.
        scope: 'openid profile offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        // The test IdP issues tokens valid for 300 seconds. Renewing 290 seconds
        // before expiry makes the refresh-token renew kick in after ~10 seconds.
        renewTimeBeforeTokenExpiresInSeconds: 290,
        strictIssuerValidationOnWellKnownRetrievalOff: true,
        ignoreNonceAfterRefresh: true,
        maxIdTokenIatOffsetAllowedInSeconds: 600,
        issValidationOff: false,
        autoUserInfo: false,
        logLevel: LogLevel.Debug,
        customParamsAuthRequest: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
