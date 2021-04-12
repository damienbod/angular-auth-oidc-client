import { NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
      redirectUrl: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      clientId: 'angularCodeRefreshTokens',
      scope: 'openid profile email taler_api offline_access',
      responseType: 'code',
      silentRenew: true,
      useRefreshToken: true,
      logLevel: LogLevel.Debug,
    }),
  ],
  providers: [OidcConfigService],
  exports: [AuthModule],
})
export class AuthConfigModule {}
