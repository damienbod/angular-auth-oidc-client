import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
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
