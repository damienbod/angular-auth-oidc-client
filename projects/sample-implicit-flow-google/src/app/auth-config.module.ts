import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';

export function configureAuth(oidcConfigService: OidcConfigService) {
  return () =>
    oidcConfigService.withConfig({
      stsServer: 'https://accounts.google.com',
      redirectUrl: window.location.origin,
      clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
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
      // iss_validation_off: false
      // disable_iat_offset_validation: true
    });
}

@NgModule({
  imports: [AuthModule.forRoot()],
  providers: [
    OidcSecurityService,
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
