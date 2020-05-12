# Useful Features of this library

-   [Public Events](#public-events)
-   [Custom Storage](#custom-storage)
-   [Custom parameters](#custom-parameters)
-   [OnAuthorizationResult Event](#onauthorizationresult-event)
-   [Using the OIDC package in a module or a Angular lib](#using-the-oidc-package-in-a-module-or-a-angular-lib)
-   [Delay the loading or pass an existing AuthWellKnownEndpoints config](#delay-the-loading-or-pass-an-existing-authwellknownendpoints-config)

## Public Events

The library exposes several events which are happening during the runtime. You can subscribe to those events by using the `PublicEventsService`.

Currently the events

```typescript
{
    ConfigLoaded,
    CheckSessionReceived,
    UserDataChanged,
    NewAuthorizationResult,
    TokenExpired,
    IdTokenExpired,
}
```

are supported.

> Notice that the `ConfigLoaded` event only runs inside the `AppModule`s constructor as the config is loaded with the `APP_INITIALIZER` of Angular.

You can inject the service and use the events like this:

```typescript
import { PublicEventsService } from 'angular-auth-oidc-client';

constructor(private eventService: PublicEventsService) {
    this.eventService
            .registerForEvents()
            .pipe(filter((notification) => notification.type === EventTypes.CheckSessionReceived))
            .subscribe((value) => console.log('CheckSessionChanged with value ', value));
}
```

The `Notification` being sent out comes with a `type` and a `value`.

```ts
export interface OidcClientNotification<T> {
    type: EventTypes;
    value?: T;
}
```

Pass inside the `filter` the type of event you are interested in and subscribe to it.

## Custom Storage

If you need, you can create a custom storage (for example to use cookies).

Implement `AbstractSecurityStorage` and the `read` and `write` methods:

```typescript
@Injectable()
export class CustomStorage implements AbstractSecurityStorage {

    public read(key: string): any {
        ...
        return ...
    }

    public write(key: string, value: any): void {
        ...
    }

}
```

Then provide the class in the module:

```typescript
@NgModule({
    imports: [
        ...
        AuthModule.forRoot({ storage: CustomStorage })
    ],
    ...
})
```

## Custom parameters

Custom parameters can be added to the auth request by adding them to the config you are calling the `withConfig(...)` method with. They are provided by

```typescript
customParams?: {
    [key: string]: string | number | boolean;
};
```

so you can pass them as an object like this:

```typescript
export function loadConfig(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            // ...
            customParams: {
                response_mode: 'fragment',
                prompt: 'consent',
            },
        });
}
```

## Dynamic custom parameters

If you want to pass dynamic custom parameters with the request url to the sts you can do that by passing the parameters into the `authorize` method.

```typescript
login() {
    this.oidcSecurityService.authorize({ customParams: { 'ui_locales: 'de-CH' });
}

```

> If you want to pass staitc parameters to the sts everytime please use the custom parameters in the [Configuration](configuration.md) instead!

## OnAuthorizationResult Event

This event returns the result of the authorization callback.

Subscribe to the event:

```typescript
//...
    this.onAuthorizationResultSubscription = this.oidcSecurityService.onAuthorizationResult.pipe(
        filter((authorizationState: AuthorizationState) => authorizationResult.authorizationState === AuthorizationState.unauthorized)
    ).subscribe(() => {
        this.router.navigate(['/unauthorized']);
    });
//...

private onAuthorizationResultSubscription: Subscription;

ngOnDestroy(): void {
    if(this.onAuthorizationResultSubscription) {
        this.onAuthorizationResultSubscription.unsubscribe();
    }
}
```

## Using the OIDC package in a module or a Angular lib

This example shows how you could set the configuration when loading a child module.

> This is not recommended. Please use the initialization on root level.

You can use the `APP_INITIALIZER` also in child modules with the same syntax.

```typescript
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { AuthModule, OidcConfigService, LogLevel } from 'angular-auth-oidc-client';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export function configureAuth(oidcConfigService: OidcConfigService) {
    const action$ = oidcConfigService.withConfig({
        stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'angularClient',
        scope: 'openid profile email',
        responseType: 'code',
        silentRenew: true,
        silentRenewUrl: `${window.location.origin}/silent-renew.html`,
        renewTimeBeforeTokenExpiresInSeconds: 10,
        logLevel: LogLevel.Debug,
    });
    return () => action$;
}

@NgModule({
    declarations: [
        /* */
    ],
    imports: [AuthModule.forRoot(), HttpClientModule, CommonModule, RouterModule],
    exports: [
        /* */
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
})
export class ChildModule {}
```

The components code is the same then as using it in the main or any other module.

## Delay the loading or pass an existing `.well-known/openid-configuration` configuration

The secure token server `.well-known/openid-configuration` configuration can be requested via an HTTPS call when starting the application in the `APP_INITIALIZER`. This HTTPS call may affect your first page loading time. You can disable this and configure the loading of the `.well-known/openid-configuration` later, just before you start the authentication process. You as a user, can decide when you want to request the well known endpoints.

The property `eagerLoadAuthWellKnownEndpoints` in the configuration sets exactly this. The default is set to `false`, so the `.well-known/openid-configuration` is loaded at the start as in previous versions. Setting this to `true` the `.well-known/openid-configuration` will be loaded when the user starts the authentication.

You alos have the option to pass the already existing `.well-known/openid-configuration` into the `withConfig` method as a second parameter. In this case no HTTPS call to load the `.well-known/openid-configuration` will be made.

```typescript
oidcConfigService.withonfig(
    {
        /* config */
    },
    { issuer: 'myIssuer' /* more .well-known/openid-configuration Properties */ }
);
```
