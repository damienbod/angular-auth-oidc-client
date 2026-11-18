---
sidebar_label: Public Events
sidebar_position: 5
---

# Public Events

The library exposes several events which are happening during the runtime. You can subscribe to those events by using the `PublicEventsService`.

Currently the following events are supported:

```ts
export enum EventTypes {
  ConfigLoaded,
  CheckingAuth,
  CheckingAuthFinished,
  CheckingAuthFinishedWithError,
  ConfigLoadingFailed,
  CheckSessionReceived,
  UserDataChanged,
  NewAuthenticationResult,
  TokenExpired,
  IdTokenExpired,
  SilentRenewStarted,
  SilentRenewFailed,
}
```

> `ConfigLoaded` is fired once per valid configuration whenever the library (re)loads the configurations: on the first call that needs a config, and again on every `checkAuth()`, `checkAuthMultiple()`, `checkAuthIncludingServer()`, `authorizeWithPopUp()`, `forceRefreshSession()` and `logoff*()` call. Its value is the `OpenIdConfiguration`.

> `registerForEvents()` replays only the **last** event to a new subscriber, so subscribe early (for example in your root component's constructor) if you need events fired during startup.

You can inject the service and use the events like this.
Using the `filter` operator from RxJS you can decide which events you are interested in and subscribe to them.

```ts
import { Component, inject, OnInit } from '@angular/core';
import { filter } from 'rxjs/operators';
import { EventTypes, PublicEventsService } from 'angular-auth-oidc-client';

@Component({
  /* ... */
})
export class AppComponent implements OnInit {
  private readonly eventService = inject(PublicEventsService);

  ngOnInit(): void {
    this.eventService
      .registerForEvents()
      .pipe(filter((notification) => notification.type === EventTypes.CheckSessionReceived))
      .subscribe((value) => console.log('CheckSessionChanged with value', value));
  }
}
```

The `Notification` being sent out comes with a `type` and a `value`.

```ts
export interface OidcClientNotification<T> {
  type: EventTypes;
  value?: T;
}
```

## Event details

| Event                           | When it is fired                                                                                                                                             | `value`                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `ConfigLoaded`                  | A configuration was validated and stored (see the note above).                                                                                               | `OpenIdConfiguration`                                                                |
| `ConfigLoadingFailed`           | Loading the identity provider's well-known document failed. Not fired when your config loader fails.                                                        | `null`                                                                               |
| `CheckingAuth`                  | `checkAuth()` starts. Not fired by `checkAuthMultiple()`, `checkAuthIncludingServer()` or `withAppInitializerAuthCheck()`.                                   | none                                                                                 |
| `CheckingAuthFinished`          | The auth check of a config finished without error.                                                                                                           | none                                                                                 |
| `CheckingAuthFinishedWithError` | Processing the callback during the auth check failed.                                                                                                        | `string` (the error message)                                                         |
| `CheckSessionReceived`          | The check session iframe answered `changed` or `unchanged`. Not fired for `error`.                                                                           | `'changed' \| 'unchanged'`                                                           |
| `UserDataChanged`               | User data was stored, published or reset (reset happens on logout).                                                                                          | `{ configId: string; userData: any }`, `userData` is `null` on reset                 |
| `NewAuthenticationResult`       | A login, callback or renew was validated, successfully or not.                                                                                               | `AuthStateResult`: `{ isAuthenticated, validationResult, isRenewProcess, configId? }` |
| `TokenExpired`                  | An access token expiry check found the token expired. Can fire repeatedly.                                                                                   | `true`                                                                               |
| `IdTokenExpired`                | An id token expiry check found the token expired. Only when `triggerRefreshWhenIdTokenExpired` is `true` and `disableIdTokenValidation` is `false`.          | `true`                                                                               |
| `SilentRenewStarted`            | A silent renew or refresh (periodic or forced) starts.                                                                                                       | none                                                                                 |
| `SilentRenewFailed`             | That silent renew or refresh failed.                                                                                                                         | the error                                                                            |

> The `NewAuthenticationResult` event only tells you that a new result was validated, it does not carry the tokens. If you need the tokens of every new result, use [`tokens$`](public-api.md#tokens) of the `OidcSecurityService`, which is built on this event.
