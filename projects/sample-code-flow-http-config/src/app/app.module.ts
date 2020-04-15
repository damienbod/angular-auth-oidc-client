import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, OidcConfigService } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return () =>
        oidcConfigService.withConfig(
            { customConfigServer: `https://offeringsolutions-sts.azurewebsites.net/api/ClientAppSettings` },
            (customConfig) => {
                return {
                    stsServer: customConfig.stsServer,
                    redirectUrl: customConfig.redirect_url,
                    clientId: customConfig.client_id,
                    responseType: customConfig.response_type,
                    scope: customConfig.scope,
                    postLogoutRedirectUri: customConfig.post_logout_redirect_uri,
                    startCheckSession: customConfig.start_checksession,
                    silentRenew: customConfig.silent_renew,
                    silentRenewUrl: customConfig.redirect_url + '/silent-renew.html',
                    postLoginRoute: customConfig.startup_route,
                    forbiddenRoute: customConfig.forbidden_route,
                    unauthorizedRoute: customConfig.unauthorized_route,
                    logConsoleWarningActive: customConfig.log_console_warning_active,
                    logConsoleDebugActive: customConfig.log_console_debug_active,
                    maxIdTokenIatOffsetAllowedInSeconds: customConfig.max_id_token_iat_offset_allowed_in_seconds,
                    historyCleanupOff: true,
                };
            }
        );
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot([
            { path: '', component: AppComponent },
            { path: 'home', component: AppComponent },
            { path: 'forbidden', component: AppComponent },
            { path: 'unauthorized', component: AppComponent },
        ]),
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
