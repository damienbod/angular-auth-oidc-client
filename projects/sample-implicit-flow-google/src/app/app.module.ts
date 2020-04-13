import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { Configuration } from './app.constants';
import { routing } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { NavigationComponent } from './navigation/navigation.component';
import { AutoLoginComponent } from './auto-login/auto-login.component';

import {
    AuthModule,
    OidcSecurityService,
    ConfigResult,
    OidcConfigService,
    OpenIdConfiguration
} from 'angular-auth-oidc-client';

export function loadConfig(oidcConfigService: OidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return () => oidcConfigService.load_using_stsServer('https://accounts.google.com');
}

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        routing,
        HttpClientModule,
        AuthModule.forRoot(),
    ],
    declarations: [
        AppComponent,
        ForbiddenComponent,
        HomeComponent,
        AutoLoginComponent,
        NavigationComponent,
        UnauthorizedComponent
    ],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true
        },
        Configuration
    ],
    bootstrap:    [AppComponent],
})

export class AppModule {
    constructor(
        private oidcSecurityService: OidcSecurityService,
        private oidcConfigService: OidcConfigService,
    ) {

        this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) => {

            const config: OpenIdConfiguration = {
                stsServer: 'https://accounts.google.com',
                redirect_url: 'https://localhost:44386',
                client_id: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
                response_type: 'id_token token',
                scope: 'openid email profile',
                trigger_authorization_result_event: true,
                post_logout_redirect_uri: 'https://localhost:44386/unauthorized',
                start_checksession: false,
                silent_renew: false,
                silent_renew_url: 'https://localhost:44386/silent-renew.html',
                post_login_route: '/home',
                forbidden_route: '/forbidden',
                unauthorized_route: '/unauthorized',
                log_console_warning_active: true,
                log_console_debug_active: true,
                max_id_token_iat_offset_allowed_in_seconds: 30,
                history_cleanup_off: true
                // iss_validation_off: false
                // disable_iat_offset_validation: true
            };

            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
        });

        console.log('APP STARTING');
    }
}
