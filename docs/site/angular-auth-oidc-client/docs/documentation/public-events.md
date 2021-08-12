---
sidebar_label: Public Events
sidebar_position: 6
---

# Public Events

The library exposes several events which are happening during the runtime. You can subscribe to those events by using the `PublicEventsService`.

Currently the events

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

are supported.

> Notice that the `ConfigLoaded` event only runs inside the `AppModule`s constructor as the config is loaded with the `APP_INITIALIZER` of Angular inside of the lib.

You can inject the service and use the events like this:

```ts
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
