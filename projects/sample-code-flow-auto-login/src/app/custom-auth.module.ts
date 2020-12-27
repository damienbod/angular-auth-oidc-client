import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: window.location.origin,
            clientId: 'angularJwtClient',
            scope: 'openid profile email',
            responseType: 'code',
            triggerAuthorizationResultEvent: true,
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
export class CustomAuthModule {}
