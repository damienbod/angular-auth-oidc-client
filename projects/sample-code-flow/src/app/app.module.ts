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
            config.redirect_url = 'https://localhost:4200';
            config.client_id = 'angularClient';
            config.scope = 'openid profile email';
            config.response_type = 'code';

            config.silent_renew = true;
            config.silent_renew_url = 'https://localhost:4200/silent-renew.html';
            config.log_console_debug_active = true;

            //config.start_checksession = true;
            //config.post_login_route = '/home';
            //config.forbidden_route = '/home';
            //config.unauthorized_route = '/home';
            //config.max_id_token_iat_offset_allowed_in_seconds = 5;
            //config.history_cleanup_off = true;

            const authWellKnownEndpoints = new AuthWellKnownEndpoints();
            authWellKnownEndpoints.setWellKnownEndpoints(this.oidcConfigService.wellKnownEndpoints);

            this.oidcSecurityService.setupModule(config, authWellKnownEndpoints);
        });
    }
}
