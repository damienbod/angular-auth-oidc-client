import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';

export function configureAuth(oidcConfigService: OidcConfigService) {
  return () =>
    oidcConfigService.withConfig({
      stsServer: 'http://localhost:3000',
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
      customParams: {
        prompt: 'consent', // login, consent
      },
    });
}

@NgModule({
  imports: [AuthModule.forRoot()],
  providers: [
    OidcConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: configureAuth,
      deps: [OidcConfigService],
      multi: true,
    },
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
