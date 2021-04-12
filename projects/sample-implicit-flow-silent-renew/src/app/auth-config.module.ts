import { NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
      redirectUrl: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      clientId: 'angularImplicitClient',
      scope: 'openid profile email',
      responseType: 'id_token token',
      silentRenewUrl: `${window.location.origin}/silent-renew.html`,
      startCheckSession: true,
      silentRenew: true,
      logLevel: LogLevel.Debug,
    }),
  ],
  providers: [OidcConfigService],
  exports: [AuthModule],
})
export class AuthConfigModule {}
