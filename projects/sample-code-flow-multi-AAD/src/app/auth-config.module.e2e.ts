import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

// Swapped in for auth-config.module.ts by the "e2e" build configuration.
// Points the sample at the local test IdP (projects/integration-tests/test-idp-server)
// so the end-to-end tests in /e2e can run without an external identity provider.
// Each config uses its own realm and client; the Entra ID specific options are
// kept to exercise those code paths.
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          authority: 'http://localhost:8081/idp1',
          authWellknownEndpointUrl: 'http://localhost:8081/idp1',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp1',
          scope: 'openid offline_access',
          responseType: 'code',
          silentRenew: true,
          // The test IdP issues tokens valid for 300 seconds. Renewing 290 seconds
          // before expiry makes the refresh-token renew kick in after ~10 seconds.
          renewTimeBeforeTokenExpiresInSeconds: 290,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false,
          strictIssuerValidationOnWellKnownRetrievalOff: true,
          autoUserInfo: false,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
          logLevel: LogLevel.Debug,
        },
        {
          authority: 'http://localhost:8081/idp2',
          authWellknownEndpointUrl: 'http://localhost:8081/idp2',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp2',
          scope: 'openid profile offline_access email',
          responseType: 'code',
          silentRenew: true,
          renewTimeBeforeTokenExpiresInSeconds: 290,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
          strictIssuerValidationOnWellKnownRetrievalOff: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false,
          autoUserInfo: false,
          logLevel: LogLevel.Debug,
          customParamsAuthRequest: {
            prompt: 'select_account',
          },
        },
        {
          authority: 'http://localhost:8081/idp3',
          authWellknownEndpointUrl: 'http://localhost:8081/idp3',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: 'client-idp3',
          // Like the original, no offline_access: this config gets no refresh token.
          scope: 'openid profile',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false,
          autoUserInfo: false,
          logLevel: LogLevel.Debug,
        },
      ],
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
