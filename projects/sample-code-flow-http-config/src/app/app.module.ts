import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, ConfigResult, OidcConfigService, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return () => oidcConfigService.load(`https://offeringsolutions-sts.azurewebsites.net/api/ClientAppSettings`);
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
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private oidcSecurityService: OidcSecurityService, private oidcConfigService: OidcConfigService) {

      this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) => {

             const config: OpenIdConfiguration = {
                stsServer: configResult.customConfig.stsServer,
                redirectUrl: configResult.customConfig.redirect_url,
                clientId: configResult.customConfig.client_id,
                responseType: configResult.customConfig.response_type,
                scope: configResult.customConfig.scope,
                postLogoutRedirectUri: configResult.customConfig.post_logout_redirect_uri,
                startCheckSession: configResult.customConfig.start_checksession,
                silentRenew: configResult.customConfig.silent_renew,
                silentRenewUrl: configResult.customConfig.redirect_url + '/silent-renew.html',
                postLoginRoute: configResult.customConfig.startup_route,
                forbiddenRoute: configResult.customConfig.forbidden_route,
                unauthorizedRoute: configResult.customConfig.unauthorized_route,
                logConsoleWarningActive: configResult.customConfig.log_console_warning_active,
                logConsoleDebugActive: configResult.customConfig.log_console_debug_active,
                maxIdTokenIatOffsetAllowedInSeconds: configResult.customConfig.max_id_token_iat_offset_allowed_in_seconds,
                historyCleanupOff: true
            };

            console.log("from server: " +configResult.customConfig.apiServer)
            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
        });



    }
}
