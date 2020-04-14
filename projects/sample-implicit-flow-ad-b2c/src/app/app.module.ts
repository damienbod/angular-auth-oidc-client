import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, ConfigResult, OidcConfigService, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthorizationGuard } from './authorization.guard';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ProtectedComponent } from './protected/protected.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.loadUsingCustomStsServer(
            'https://damienbod.b2clogin.com/damienbod.onmicrosoft.com/B2C_1_b2cpolicydamien/v2.0/.well-known/openid-configuration'
        );
}

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        HomeComponent,
        AutoLoginComponent,
        ForbiddenComponent,
        UnauthorizedComponent,
        ProtectedComponent,
    ],
    imports: [
        BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
        HttpClientModule,
        AuthModule.forRoot(),
        FormsModule,
        routing,
    ],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true,
        },
        AuthorizationGuard,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private oidcSecurityService: OidcSecurityService, private oidcConfigService: OidcConfigService) {
        this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) => {
            const config: OpenIdConfiguration = {
                stsServer: 'https://login.microsoftonline.com/damienbod.onmicrosoft.com/v2.0',
                redirectUrl: 'https://localhost:65328',
                postLogoutRedirectUri: 'https://localhost:65328',
                clientId: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
                scope: 'openid https://damienbod.onmicrosoft.com/testapi/demo.read',
                responseType: 'id_token token',
                silentRenew: false,
                autoUserinfo: false,
                silentRenewUrl: 'https://localhost:65328/silent-renew.html',
                logConsoleDebugActive: true,
                maxIdTokenIatOffsetAllowedInSeconds: 500,
            };

            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);

            this.oidcSecurityService.setCustomRequestParameters({
                response_mode: 'fragment',
                prompt: 'consent',
            });
        });

        console.log('APP STARTING');
    }
}
