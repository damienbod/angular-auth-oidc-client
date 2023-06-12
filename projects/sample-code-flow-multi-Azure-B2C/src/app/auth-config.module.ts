import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          authority:
            'https://b2cdamienbod.b2clogin.com/b2cdamienbod.onmicrosoft.com/B2C_1_sign_in/v2.0',
          authWellknownEndpointUrl:
            'https://b2cdamienbod.b2clogin.com/b2cdamienbod.onmicrosoft.com/B2C_1_sign_in/v2.0/.well-known/openid-configuration',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: '00b1b58e-6193-4be1-bf15-3a37d6adefaf',
          scope:
            'openid profile https://b2cdamienbod.onmicrosoft.com/ac9b845d-96d3-4410-9923-50ec7bc80db9/access_as_user',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false, // this needs to be true if using a common endpoint in Azure
          autoUserInfo: false,
          logLevel: LogLevel.Debug,
        },
        {
          authority:
            'https://b2cdamienbod.b2clogin.com/b2cdamienbod.onmicrosoft.com/B2C_1_sign_in/v2.0',
          authWellknownEndpointUrl:
            'https://b2cdamienbod.b2clogin.com/b2cdamienbod.onmicrosoft.com/B2C_1_sign_in/v2.0/.well-known/openid-configuration',
          redirectUrl: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          clientId: '00b1b58e-6193-4be1-bf15-3a37d6adefaf',
          scope:
            'openid profile https://b2cdamienbod.onmicrosoft.com/c41bf62e-73e6-4f5d-bed5-70ba1b2c8284/access_as_user',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false, // this needs to be true if using a common endpoint in Azure
          autoUserInfo: false,
          logLevel: LogLevel.Debug,
        },
      ],
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
