# Useful Features of this library

## Public Events

The library exposes several events which are happening during the runtime. You can subscribe to those events by using the `PublicEventsService`.

Currently the events

```ts
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

Pass inside the `filter` the type of event you want to subscribe to.

## Custom Storage

If you need, you can create a custom storage (for example to use cookies).

Implement `OidcSecurityStorage` class-interface and the `read` and `write` methods:

```typescript
@Injectable()
export class CustomStorage implements OidcSecurityStorage {

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

## Adding custom parameters to the authorization request

Custom parameters can be added to the auth request by using the setCustomRequestParameters method. Here you could add ui_locale, acr or whatever you request for your token server.

```typescript
this.oidcSecurityService.setCustomRequestParameters({ ui_locales: culture });
```

## Redirect after login (not implemented yet)
