---
sidebar_label: Public Events
sidebar_position: 5
---

# Public Events

The library exposes several events which are happening during the runtime. You can subscribe to those events by using the `PublicEventsService`.

Currently the following events are supported:

```ts
{
    ConfigLoaded,
    ConfigLoadingFailed,
    CheckSessionReceived,
    UserDataChanged,
    NewAuthenticationResult,
    TokenExpired,
    IdTokenExpired,
    SilentRenewStarted,
}
```

> Notice that the `ConfigLoaded` event only runs inside the constructor of the `AppModule` as the config is loaded with the `APP_INITIALIZER` of Angular inside of the lib.

You can inject the service and use the events like this.
Using the `filter` operator from RxJS you can decide which events you are interested in and subscribe to them.

```ts
import { PublicEventsService } from 'angular-auth-oidc-client';

constructor(private eventService: PublicEventsService) {
  this.eventService
    .registerForEvents()
    .pipe(filter((notification) => notification.type === EventTypes.CheckSessionReceived))
    .subscribe((value) => console.log('CheckSessionChanged with value', value));
}
```

The `Notification` being sent out comes with a `type` and a `value`.

```ts
export interface OidcClientNotification<T> {
  type: EventTypes;
  value?: T;
}
```
