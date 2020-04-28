# Useful Features of this library

-   [Public Events](#public-events)
-   [Custom Storage](#custom-storage)
-   [Custom parameters](#custom-parameters)

## Public Events

The library exposes several events which are happening during the runtime. You can subscribe to those events by using the `PublicEventsService`.

Currently the events

```typescript
{
    ConfigLoaded,
    ModuleSetup,
    CheckSessionChanged,
    UserDataChanged,
    NewAuthorizationResult,
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
            .pipe(filter((notification) => notification.type === EventTypes.CheckSessionChanged))
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

## Redirect after login (not implemented yet)
