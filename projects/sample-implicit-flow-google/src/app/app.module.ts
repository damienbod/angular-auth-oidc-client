import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, ConfigResult, OidcConfigService, OidcSecurityService, OpenIdConfiguration } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { Configuration } from './app.constants';
import { routing } from './app.routes';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavigationComponent } from './navigation/navigation.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function loadConfig(oidcConfigService: OidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return () => oidcConfigService.loadUsingStsServer('https://accounts.google.com');
}

@NgModule({
    imports: [BrowserModule, FormsModule, routing, HttpClientModule, AuthModule.forRoot()],
    declarations: [AppComponent, ForbiddenComponent, HomeComponent, AutoLoginComponent, NavigationComponent, UnauthorizedComponent],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true,
        },
        Configuration,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private oidcSecurityService: OidcSecurityService, private oidcConfigService: OidcConfigService) {
        this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) => {
            const config: OpenIdConfiguration = {
                stsServer: 'https://accounts.google.com',
                redirectUrl: 'https://localhost:44386',
                clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
                responseType: 'id_token token',
                scope: 'openid email profile',
                triggerAuthorizationResultEvent: true,
                postLogoutRedirectUri: 'https://localhost:44386/unauthorized',
                startCheckSession: false,
                silentRenew: false,
                silentRenewUrl: 'https://localhost:44386/silent-renew.html',
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

        console.log('APP STARTING');
    }
}
