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

or for a specific config:

```ts
this.oidcSecurityService.getAccessToken('configId').subscribe(at => ...);
```

You can then manually use the token within `HttpHeaders` when performing an HTTP request with Angular's `HttpClient`:

```ts
import { HttpHeaders } from '@angular/common/http';

this.oidcSecurityServices.getAccessToken().subscribe((token) => {
  const httpOptions = {
    headers: new HttpHeaders({
      Authorization: 'Bearer ' + token,
    }),
  };
});
```

## Revoke the access token

Access tokens can be revoked using the `revokeAccessToken()` method. If you provide the access token as a parameter, any access token from the same Security Token Service can be revoked, if the Security Token Service supports the revocation endpoint.

```ts
revokeAccessToken() {
  this.oidcSecurityService.revokeAccessToken()
      .subscribe((result) => console.log(result));
}
```
