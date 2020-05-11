import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, LogLevel, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
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
        oidcConfigService.withConfig({
            stsServer: 'https://login.microsoftonline.com/damienbod.onmicrosoft.com/v2.0',
            authWellknownEndpoint:
                'https://damienbod.b2clogin.com/damienbod.onmicrosoft.com/B2C_1_b2cpolicydamien/v2.0/.well-known/openid-configuration',
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: 'f1934a6e-958d-4198-9f36-6127cfc4cdb3',
            scope: 'openid offline_access https://damienbod.onmicrosoft.com/testapi/demo.read',
            responseType: 'code',
            silentRenew: true,
            autoUserinfo: false,
            silentRenewUrl: window.location.origin + '/silent-renew.html',
            logLevel: LogLevel.Debug,
            renewTimeBeforeTokenExpiresInSeconds: 3500,
            useRefreshToken: true,
            ignoreNonceAfterRefresh: true,
            disableRefreshIdTokenAuthTimeValidation: true,
        });
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
export class AppModule {}
