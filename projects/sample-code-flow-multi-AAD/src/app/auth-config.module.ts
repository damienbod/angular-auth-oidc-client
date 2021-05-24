import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          stsServer: 'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
          authWellknownEndpointUrl: 'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
          redirectUrl: window.location.origin,
          clientId: 'ad6b0351-92b4-4ee9-ac8d-3e76e5fd1c67',
          scope: 'openid offline_access api://577ea995-2235-40d3-9c96-047afda4ab02/access_as_user',
          responseType: 'code',
          silentRenew: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false,
          autoUserInfo: false,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
          logLevel: LogLevel.Debug,
        },
        {
          stsServer: 'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
          authWellknownEndpointUrl: 'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
          redirectUrl: window.location.origin,
          clientId: 'ad6b0351-92b4-4ee9-ac8d-3e76e5fd1c67',
          scope: 'openid profile offline_access email api://98328d53-55ec-4f14-8407-0ca5ff2f2d20/access_as_user',
          responseType: 'code',
          silentRenew: true,
          useRefreshToken: true,
          ignoreNonceAfterRefresh: true,
          maxIdTokenIatOffsetAllowedInSeconds: 600,
          issValidationOff: false, // this needs to be true if using a common endpoint in Azure
          autoUserInfo: false,
          logLevel: LogLevel.Debug,
          customParamsAuthRequest: {
            prompt: 'select_account', // login, consent
          },
        },
        {
          stsServer: 'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
          authWellknownEndpointUrl: 'https://login.microsoftonline.com/7ff95b15-dc21-4ba6-bc92-824856578fc1/v2.0',
          redirectUrl: window.location.origin,
          clientId: 'ad6b0351-92b4-4ee9-ac8d-3e76e5fd1c67',
          scope: 'openid profile User.ReadBasic.All',
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
