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
        clientId: 'client-idp1',
        responseType: 'id_token token',
        scope: 'openid email profile',
        triggerAuthorizationResultEvent: true,
        postLogoutRedirectUri: window.location.origin + '/unauthorized',
        startCheckSession: false,
        silentRenew: false,
        silentRenewUrl: window.location.origin + '/silent-renew.html',
        postLoginRoute: '/home',
        forbiddenRoute: '/forbidden',
        unauthorizedRoute: '/unauthorized',
        logLevel: LogLevel.Debug,
        historyCleanupOff: true,
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
