import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';

export function configureAuth(oidcConfigService: OidcConfigService) {
  return () =>
    oidcConfigService.withConfig({
      stsServer: 'https://dev-damienbod.eu.auth0.com',
      redirectUrl: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      clientId: 'Ujh5oSBAFr1BuilgkZPcMWEgnuREgrwU',
      scope: 'openid profile offline_access auth0-user-api-spa',
      responseType: 'code',
      silentRenew: true,
      useRefreshToken: true,
      logLevel: LogLevel.Debug,
      customParams: {
        audience: 'https://auth0-api-spa',
      },
      customParamsRefreshToken: {
        scope: 'openid profile offline_access auth0-user-api-spa',
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
