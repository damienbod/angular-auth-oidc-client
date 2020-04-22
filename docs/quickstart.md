# Quickstart

After installing the library you can get started with the lib like below.

## Using a local configuration

Import the module and services in your module.

```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, EventsService, EventTypes, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';
// ...

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: 'https://localhost:4200',
            postLogoutRedirectUri: 'https://localhost:4200',
            clientId: 'angularClient',
            scope: 'openid profile email',
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: 'https://localhost:4200/silent-renew.html',
            logLevel: LogLevel.Debug,
        });
}

@NgModule({
    // ...
    imports: [
        // ...
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    // ...
})
export class AppModule {}
```

## Using a configuration from an http source

Sometimes it is required to load custom `.well-known/openid-configuration`. You can load the config from your source, map it into the required format and use the `withConfig(...)` method as usual.

> There properties are just an example, you have to use yours if you are choosing this way of configuring

```typescript
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
                logLevel: LogLevel.Debug, // TODO add the config back new breaking change in API
                maxIdTokenIatOffsetAllowedInSeconds: customConfig.max_id_token_iat_offset_allowed_in_seconds,
                historyCleanupOff: true,
                // autoUserinfo: false,
            };
        }),
        switchMap((config) => oidcConfigService.withConfig(config))
    );

    return () => setupAction$.toPromise();
}
```
