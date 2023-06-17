import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: 'https://offeringsolutions-sts.azurewebsites.net',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'angularCodeRefreshTokens',
        scope: 'openid profile email offline_access',
        responseType: 'code',
        silentRenew: true,
        // autoUserInfo: true,
        useRefreshToken: true,
        renewTimeBeforeTokenExpiresInSeconds: 10,
        logLevel: environment.production ? LogLevel.None : LogLevel.Debug,
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
