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
    ModuleSetup,
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

## Dynamic custom parameters

If you want to pass dynamic custom parameters with the request url to the sts you can do that by passing the parameters into the `authorize` method.

```typescript
login() {
    this.oidcSecurityService.authorize(null, { to: 'add', as: 'well' });
}

```

> If you want to pass staitc parameters to the sts everytime please use the custom parameters in the [Configuration](configuration.md) instead!
