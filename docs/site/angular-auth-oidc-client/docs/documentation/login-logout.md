---
sidebar_label: Login & Logout
sidebar_position: 3
---

# Login & Logout

## Login

For logging in a user you can call the `authorize()` method:

```ts
private readonly oidcSecurityService = inject(OidcSecurityService);

// ...
this.oidcSecurityService.authorize();
```

The supplied configuration will be used and the user will be redirected to the Security Token Service to log into your app.

> The configuration on server _and_ client side has to be valid to finish the login successfully!

### `ConfigId` Parameter

In case you have multiple configs you can pass the `configId` parameter as the first argument to select a specific config:

```ts
login() {
  this.oidcSecurityService.authorize('configId');
}
```

### AuthOptions

You can pass in AuthOptions following optional parameters:

- `urlHandler` - to manipulate the behavior of the login with a custom `urlHandler`
- `customParams` - to send custom parameters to OIDC Provider
- `redirectUrl` - to override the redirectUrl defined in the configuration

```ts
login() {
  const authOptions = {
    customParams: {
      some: 'params',
    },
    urlHandler: () => {
      // ...
    },
    redirectUrl: "/assets/login-popup-page.html"
  };

  const configIdOrUndefined = // ...

  this.oidcSecurityService.authorize(configIdOrUndefined, authOptions);
}

```

### Pushed Authorization Requests (PAR)

Set `usePushedAuthorisationRequests: true` in the configuration to send the authorize parameters to the `pushed_authorization_request_endpoint` of the identity provider first. The user is then redirected (or the popup is opened) with only the returned `request_uri`. Both `authorize()` and `authorizeWithPopUp()` support this, and the `urlHandler` and `customParams` of the `AuthOptions` are still used.

PAR cannot be combined with the iframe silent renew; use refresh tokens instead.

[PAR Sample](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-par)

## Login using a Popup

You can authenticate with any OpenID Connect identity provider using a popup.

This allows you to have the provider's consent prompt display in a popup window to avoid unloading and reloading the app.

### Sample

```ts
loginWithPopup() {
  this.oidcSecurityService.authorizeWithPopUp()
          .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
    /* use data */
  });
}
```

If the user closes the popup, the observable emits `isAuthenticated: false` with `errorMessage: 'User closed popup'`. If a popup is already open, `errorMessage` is `'There is already a popup open.'`.

Any message posted to the window that is not a string closes the popup. Set `disableCleaningPopupOnInvalidMessage: true` in the configuration if other scripts post messages to your window.

### PopupOptions

You can set the size of the popup with `width` and `height` of the `PopupOptions` interface as a second parameter (default 500 × 500). The popup is always centered on the current window; `left` and `top` are currently ignored.

```ts
loginWithPopup() {
  const somePopupOptions = { width: 500, height: 500, left: 50, top: 50 };

  const authOptions = /* ... */

  this.oidcSecurityService.authorizeWithPopUp(authOptions, somePopupOptions)
    .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
    /* ... */
    });
}
```

### `ConfigId` Parameter

In case you have multiple configs you can pass the `configId` parameter as the last argument.

```ts
loginWithPopup() {
  const somePopupOptions = /* ... */;

  const authOptions = /* ... */

  this.oidcSecurityService.authorizeWithPopUp(authOptions, somePopupOptions, 'configId')
    .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
    /* ... */
    });
}
```

### Using custom popup login page

You can pass a custom login page in AuthOptions (_authOptions.redirectUrl_).

A simplified page (instead of the application url) can be used. Here's an example:

```html
<html>
  <head>
    <script>
      function sendMessage() {
        // post url containing oidc response (redirected from OP)
        const urlWithOidcResp = window.location.href;
        window.opener.postMessage(urlWithOidcResp, window.opener.location.href);
      }
    </script>
  </head>
  <body onload="sendMessage()">
    Transmitting authentication result ... (this popup will be closed
    automatically).
  </body>
</html>
```

### Popup Sample

[app.component.ts](https://github.com/damienbod/angular-auth-oidc-client/blob/main/projects/sample-code-flow-popup/src/app/app.component.ts)

## Logout

The `logoff()` method sends an end session request to the OIDC server if an end session endpoint is known and the check session has not reported a changed server state. In that case the local session is cleared and the browser is redirected to the end session endpoint (`GET`, default). With a custom `urlHandler`, the handler is called instead of the redirect.

:::info

If there is no end session endpoint, or the server state has changed, nothing is sent and the local session is **not** cleared. Call [`logoffLocal()`](#logofflocal) in that case.

:::

```ts
logout() {
  this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
}
```

### Parameters

#### configId

`logoff()` also accepts a `configId` paramater to select a specific config:

```ts
logout() {
  this.oidcSecurityService.logoff('configId')
    .subscribe((result) => console.log(result));
}
```

#### LogoutAuthOptions

You can pass in LogoutAuthOptions following optional parameters:

- `urlHandler` - to manipulate the behavior of the logout with a custom `urlHandler`
- `customParams` - to send custom parameters to OIDC Provider
- `logoffMethod` - Which can be `GET` or `POST`. `GET` is default here.

According to the [OIDC Standard](https://openid.net/specs/openid-connect-rpinitiated-1_0.html) only the customParams `state`, `logout_hint` and `ui_locales` are configurable. Other values are being created, being read from storage or taken from your config.

You can pass an `logoutAuthOptions` parameter if you want to control the behavior more.

```ts
logout() {
  const logoutAuthOptions: LogoutAuthOptions = {
    customParams: {
      logout_hint: 'some-logout-hint',
      /* other params */
    }
  };

  // Use an empty string for the configId if this is not a multiple client.
  // The returned observable is lazy: nothing happens until you subscribe.
  this.oidcSecurityService.logoff('configId', logoutAuthOptions)
    .subscribe((result) => console.log(result));
}
```

If you prefer to send a POST logout request, the local session is cleared and `id_token_hint`, `client_id`, `post_logout_redirect_uri` and the `state`, `logout_hint` and `ui_locales` custom params are posted as a form to the end session endpoint. A POST does not navigate; the returned observable emits the response of the server.

```ts
logout() {
    // logoffMethod` - Which can be `GET` or `POST
    const logoutAuthOptions: LogoutAuthOptions = {
      customParams: {
        logout_hint: 'some-logout-hint',
      },
      logoffMethod: 'POST',
    };

    this.oidcSecurityService.logoff('', logoutAuthOptions)
      .subscribe((result) => console.log(result));
}
```

### `logoffAndRevokeTokens()`

The `logoffAndRevokeTokens()` method revokes the refresh token (if present) and then the access token at the revocation endpoint, and then calls `logoff()` like above. If the identity provider has no `revocation_endpoint`, only `logoff()` is called. If the revocation fails, the observable errors and no logoff is done.

```ts
logoffAndRevokeTokens() {
  this.oidcSecurityService.logoffAndRevokeTokens()
    .subscribe((result) => console.log(result));
}
```

or an example using the LogoutAuthOptions parameters:

```ts
logoffAndRevokeTokens() {
  const logoutAuthOptions: LogoutAuthOptions = {
    customParams: {
        logout_hint: 'some-logout-hint',
    },
  };

  this.oidcSecurityService.logoffAndRevokeTokens('', logoutAuthOptions)
    .subscribe((result) => console.log(result));
}
```

The method also takes `configId` and `logoutAuthOptions` parameters if needed.

### `logoffLocal()`

The `logoffLocal()` method is used to reset your local session in the browser and stop the check session monitoring, but does not send anything to the server. It also accepts the `configId` parameter.

```ts
logoffLocal() {
  this.oidcSecurityService.logoffLocal();
}
```

### `logoffLocalMultiple()`

The `logoffLocalMultiple()` method resets the local session of all configurations without sending anything to the server. Use it instead of `logoffLocal()` when running multiple configurations.

```ts
logoffLocalMultiple() {
  this.oidcSecurityService.logoffLocalMultiple();
}
```
