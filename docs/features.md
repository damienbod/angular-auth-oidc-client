# Useful Features of this library

-   [Public Events](#public-events)
-   [Custom Storage](#custom-storage)
-   [Custom parameters](#custom-parameters)
-   [OnAuthorizationResult Event](#onauthorizationresult-event)

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

This example shows how you could set the configuration just before you use the OIDC package, and start the checkAuth then as required.
This is useful if using in a lib or require to set the configurations on the fly.

```typescript
import { Component, OnInit } from '@angular/core';
import { Observable, from } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { OidcSecurityService, OidcConfigService, LogLevel, PublicEventsService, EventTypes } from 'angular-auth-oidc-client';

@Component({
    selector: 'lib-oidc-lib',
    templateUrl: 'oidc-lib.component.html',
    styles: [],
})
export class OidcLibComponent implements OnInit {
    userData$: Observable<any>;
    isAuthenticated$: Observable<boolean>;

    constructor(
        public oidcSecurityService: OidcSecurityService,
        private oidcConfigService: OidcConfigService,
        private publicEventsService: PublicEventsService
    ) {}

    ngOnInit() {
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;

        from(
            this.oidcConfigService.withConfig({
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
            })
        )
            .pipe(switchMap(() => this.oidcSecurityService.checkAuth()))
            .subscribe((isAuth) => console.log(isAuth));
    }

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }
}
```

The auth module requires only the OidcLibModule module.

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { OidcLibModule } from 'oidc-lib';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, OidcLibModule, RouterModule.forRoot([])],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
```

The OidcLibModule is injected in the root.

```typescript
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class OidcLibService {
    constructor() {}
}
```
