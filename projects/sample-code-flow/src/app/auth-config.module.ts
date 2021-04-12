import { NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    AuthModule.forRoot({
      stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
      redirectUrl: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      clientId: 'angularClient',
      scope: 'openid profile email',
      responseType: 'code',
      silentRenew: true,
      silentRenewUrl: `${window.location.origin}/silent-renew.html`,
      renewTimeBeforeTokenExpiresInSeconds: 10,
      logLevel: environment.production ? LogLevel.None : LogLevel.Debug,
    }),
  ],
  providers: [OidcConfigService],
  exports: [AuthModule],
})
export class AuthConfigModule {}
