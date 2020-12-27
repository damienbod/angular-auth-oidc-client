import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://login.microsoftonline.com/damienbod.onmicrosoft.com/v2.0',
            authWellknownEndpoint:
                'https://damienbod.b2clogin.com/damienbod.onmicrosoft.com/B2C_1_b2cpolicydamien/v2.0/.well-known/openid-configuration',
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
            scope: 'openid https://damienbod.onmicrosoft.com/testapi/demo.read',
            responseType: 'code',
            silentRenew: true,
            autoUserinfo: false,
            silentRenewUrl: window.location.origin + '/silent-renew.html',
            logLevel: LogLevel.Debug,
            renewTimeBeforeTokenExpiresInSeconds: 60,
            // useRefreshToken: true, // for refresh renew, but revocation and one time usage is missing from server impl.
            // ignoreNonceAfterRefresh: true,
            // disableRefreshIdTokenAuthTimeValidation: true,
        });
}

@NgModule({
    imports: [AuthModule.forRoot()],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    exports: [AuthModule],
})
export class CustomAuthModule {}
