import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import {
    AuthModule,
    AuthWellKnownEndpoints,
    OidcConfigService,
    OidcSecurityService,
    OpenIDImplicitFlowConfiguration,
} from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () => oidcConfigService.load_using_stsServer('https://offeringsolutions-sts.azurewebsites.net');
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
        this.oidcConfigService.onConfigurationLoaded.subscribe(() => {
            const config = new OpenIDImplicitFlowConfiguration();
            config.stsServer = 'https://offeringsolutions-sts.azurewebsites.net';
            config.redirect_url = window.location.origin;
            config.client_id = 'angularClient';
            config.scope = 'openid profile email';
            config.response_type = 'code';
            config.storage = localStorage;

            config.silent_renew = true;
            config.silent_redirect_url = window.location.origin + 'silent_renew.html';
            config.log_console_debug_active = true;

            const authWellKnownEndpoints = new AuthWellKnownEndpoints();
            authWellKnownEndpoints.setWellKnownEndpoints(this.oidcConfigService.wellKnownEndpoints);

            this.oidcSecurityService.setupModule(config, authWellKnownEndpoints);
        });
    }
}
