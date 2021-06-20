import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
        redirectUrl: window.location.origin,
        clientId: 'angularJwtClient',
        scope: 'openid profile email',
        responseType: 'code',
        triggerAuthorizationResultEvent: false,
        postLogoutRedirectUri: `${window.location.origin}/unauthorized`,
        startCheckSession: false,
        silentRenew: true,
        silentRenewUrl: `${window.location.origin}/silent-renew.html`,
        postLoginRoute: '/home',
        forbiddenRoute: '/forbidden',
        unauthorizedRoute: '/unauthorized',
        logLevel: LogLevel.Debug,
        historyCleanupOff: true,
        // iss_validation_off: false
        // disable_iat_offset_validation: true
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
