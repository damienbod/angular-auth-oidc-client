import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

// Swapped in for auth-config.module.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
// Like the original, both configs use the same authority and client with a
// different API scope. offline_access is added because the test IdP only
// issues refresh tokens for it, and the configs use refresh tokens.
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          authority: 'http://localhost:8081/idp1',
          authWellknownEndpointUrl:
            'http://localhost:8081/idp1/.well-known/openid-configuration',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp1',
          scope: 'openid profile offline_access api1',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          strictIssuerValidationOnWellKnownRetrievalOff: true,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false,
          autoUserInfo: false,
          // The test IdP issues tokens valid for 300 seconds. Renewing 290 seconds
          // before expiry makes the refresh-token renew kick in after ~10 seconds.
          renewTimeBeforeTokenExpiresInSeconds: 290,
          logLevel: LogLevel.Debug,
        },
        {
          authority: 'http://localhost:8081/idp1',
          authWellknownEndpointUrl:
            'http://localhost:8081/idp1/.well-known/openid-configuration',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp1',
          scope: 'openid profile offline_access api2',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          strictIssuerValidationOnWellKnownRetrievalOff: true,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false,
          autoUserInfo: false,
          renewTimeBeforeTokenExpiresInSeconds: 290,
          logLevel: LogLevel.Debug,
        },
      ],
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
