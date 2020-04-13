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
    return () => oidcConfigService.loadUsingStsServer('https://offeringsolutions-sts.azurewebsites.net');
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
                stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
                redirectUrl: 'https://localhost:4200',
                clientId: 'angularClient',
                scope: 'openid profile email',
                responseType: 'code',
                triggerAuthorizationResultEvent: true,
                postLogoutRedirectUri: 'https://localhost:4200/unauthorized',
                startCheckSession: false,
                silentRenew: false,
                silentRenewUrl: 'https://localhost:4200/silent-renew.html',
                postLoginRoute: '/home',
                forbiddenRoute: '/forbidden',
                unauthorizedRoute: '/unauthorized',
                logConsoleWarningActive: true,
                logConsoleDebugActive: true,
                maxIdTokenIatOffsetAllowedInSeconds: 30,
                historyCleanupOff: true,
                // iss_validation_off: false
                // disable_iat_offset_validation: true
            };

            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
        });
    }
}
