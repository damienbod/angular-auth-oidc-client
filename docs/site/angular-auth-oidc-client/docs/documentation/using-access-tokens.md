---
sidebar_label: Using Access Tokens
sidebar_position: 10
---

# Using Access Tokens

The access token can be used by calling the `getAccessToken()` method.

## Accessing the access token

You can get the access token by calling the method `getAccessToken()` on the `OidcSecurityService`

```ts
this.oidcSecurityService.getAccessToken().subscribe(at => ...);
```

If the user is not authenticated, the observable emits an empty string.

or for a specific config:

```ts
this.oidcSecurityService.getAccessToken('configId').subscribe(at => ...);
```

You can then manually use the token within `HttpHeaders` when performing an HTTP request with Angular's `HttpClient`:

```ts
import { HttpHeaders } from '@angular/common/http';

this.oidcSecurityService.getAccessToken().subscribe((token) => {
  const httpOptions = {
    headers: new HttpHeaders({
      Authorization: 'Bearer ' + token,
    }),
  };
});
```

## Getting notified about new access tokens

`getAccessToken()` returns the stored token once and completes. To react to every new access token, including the ones from silent renewals, subscribe to `tokens$`:

```ts
this.oidcSecurityService.tokens$.subscribe(({ accessToken, isRenewProcess }) => {
  // called after the login and after every token renewal
});
```

See [`tokens$`](public-api.md#tokens) in the Public API for the emitted values and limitations.

## Revoke the access token

Access tokens can be revoked using the `revokeAccessToken(accessToken?, configId?)` method. Without a parameter, the stored access token is revoked. If you provide the access token as a parameter, any access token from the same Security Token Service can be revoked. The Security Token Service has to expose a `revocation_endpoint`. The request is retried twice, after which the observable errors with `Revocation request failed`. Refresh tokens can be revoked in the same way with `revokeRefreshToken()`.

```ts
revokeAccessToken() {
  this.oidcSecurityService.revokeAccessToken()
      .subscribe((result) => console.log(result));
}
```
