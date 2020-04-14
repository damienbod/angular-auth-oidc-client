import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AuthModule, OidcConfigService, OidcSecurityService } from 'angular-auth-oidc-client';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AutoLoginComponent } from './auto-login/auto-login.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { NavigationComponent } from './navigation/navigation.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
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
        });
}

@NgModule({
    imports: [BrowserModule, FormsModule, routing, HttpClientModule, AuthModule.forRoot()],
    declarations: [AppComponent, ForbiddenComponent, HomeComponent, AutoLoginComponent, NavigationComponent, UnauthorizedComponent],
    providers: [
        OidcSecurityService,
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
