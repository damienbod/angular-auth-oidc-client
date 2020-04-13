import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, ConfigResult, OidcConfigService, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavigationComponent } from './navigation/navigation.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () => oidcConfigService.load_using_stsServer('https://offeringsolutions-sts.azurewebsites.net');
}

@NgModule({
    imports: [BrowserModule, routing, HttpClientModule, AuthModule.forRoot()],
    declarations: [AppComponent, ForbiddenComponent, HomeComponent, AutoLoginComponent, NavigationComponent, UnauthorizedComponent],
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
                redirectUrl: 'https://localhost:4200',
                clientId: 'angularClient',
                scope: 'openid profile email',
                responseType: 'code',
                silentRenew: true,
                silentRenewUrl: 'https://localhost:4200/silent-renew.html',
                logConsoleDebugActive: true,
            };

            // config.start_checksession = true;
            // config.post_login_route = '/home';
            // config.forbidden_route = '/home';
            // config.unauthorized_route = '/home';
            // config.max_id_token_iat_offset_allowed_in_seconds = 5;
            // config.history_cleanup_off = true;

            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
        });
    }
}
