import { HttpClient } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AuthModule, OidcConfigService } from 'angular-auth-oidc-client';
import { map, switchMap } from 'rxjs/operators';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export function configureAuth(oidcConfigService: OidcConfigService, httpClient: HttpClient) {
    const setupAction$ = httpClient.get<any>(`https://offeringsolutions-sts.azurewebsites.net/api/ClientAppSettings`).pipe(
        map((customConfig) => {
            return {
                stsServer: customConfig.stsServer,
                redirectUrl: customConfig.redirect_url,
                clientId: customConfig.client_id,
                responseType: customConfig.response_type,
                scope: customConfig.scope,
                postLogoutRedirectUri: customConfig.post_logout_redirect_uri,
                startCheckSession: customConfig.start_checksession,
                silentRenew: customConfig.silent_renew,
                silentRenewUrl: customConfig.redirect_url + '/silent-renew.html',
                postLoginRoute: customConfig.startup_route,
                forbiddenRoute: customConfig.forbidden_route,
                unauthorizedRoute: customConfig.unauthorized_route,
                logLevel: customConfig.logLevel, // LogLevel.Debug,
                maxIdTokenIatOffsetAllowedInSeconds: customConfig.max_id_token_iat_offset_allowed_in_seconds,
                historyCleanupOff: true,
                // autoUserinfo: false,
            };
        }),
        switchMap((config) => oidcConfigService.withConfig(config))
    );

    return () => setupAction$.toPromise();
}

@NgModule({
    declarations: [AppComponent, HomeComponent, UnauthorizedComponent],
    imports: [
        BrowserModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: HomeComponent },
            { path: 'forbidden', component: UnauthorizedComponent },
            { path: 'unauthorized', component: UnauthorizedComponent },
        ]),
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService, HttpClient],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
