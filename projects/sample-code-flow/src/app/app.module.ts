import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, OidcConfigService, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () => oidcConfigService.loadUsingStsServer('https://offeringsolutions-sts.azurewebsites.net');
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
        this.oidcConfigService.onConfigurationLoaded.subscribe(wellKnownEndpoints => {
            const config: OpenIdConfiguration = {
                stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
                redirect_url: 'https://localhost:4200',
                client_id: 'angularClient',
                scope: 'openid profile email',
                response_type: 'code',
                silent_renew: true,
                silent_renew_url: 'https://localhost:4200/silent-renew.html',
                log_console_debug_active: true,
            };

            //config.start_checksession = true;
            //config.post_login_route = '/home';
            //config.forbidden_route = '/home';
            //config.unauthorized_route = '/home';
            //config.max_id_token_iat_offset_allowed_in_seconds = 5;
            //config.history_cleanup_off = true;

            this.oidcSecurityService.setupModule(config, wellKnownEndpoints);
        });
    }
}
