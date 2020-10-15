import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, OidcConfigService } from 'angular-auth-oidc-client';

export function configureAuth(
  oidcConfigService: OidcConfigService
) {
  return () => {
    oidcConfigService.withConfig({
      stsServer: 'please-enter-sts',
      redirectUrl: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      clientId: 'please-enter-clientId',
      scope: 'please-enter-scopes',
      responseType: 'please-enter-responseType',
      silentRenew: true,
      useRefreshToken: true,
      renewTimeBeforeTokenExpiresInSeconds: 30,
    });
  };
}

@NgModule({
  imports: [AuthModule.forRoot()],
  exports: [AuthModule],
  declarations: [],
  providers: [
    OidcConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: configureAuth,
      deps: [OidcConfigService, PlatformInformationService],
      multi: true,
    },
  ],
})
export class AuthenticationModule {}
