---
sidebar_label: Login & Logout
sidebar_position: 3
---

# Login & Logout

In this section the Login and Logout mechanisms should be briefly described.

## Login

For logging in a user you can call the `authorize()` method.

```ts
this.oidcSecurityService.authorize();
```

You configuration will be used and you will be redirected to the Security Token Server to log into your app.

> The configuration on server _and_ client side has to be correct to finish the login successful!

### `ConfigId` Parameter

In case you have multiple configs you can pass the `configId` parameter as the first argument.

```ts
login() {
  this.oidcSecurityService.authorizeWithPopUp('configId')
    .subscribe(({ isAuthenticated, userData, idToken, accessToken, errorMessage }) => {
    /* ... */
    });
}
```

### AuthOptions

You can pass options to manipulate the behavior of the login with a custom `urlHandler` or custom parameters for this request.

```ts
login() {
  const authOptions = {
    customParams: {
    some: 'params',
  },
  urlHandler: () => {
    /* ... */
    },
  };

  const configIdOrNull = /* ... */

  this.oidcSecurityService.authorizeWithPopUp(configIdOrNull, authOptions)
    .subscribe(({ isAuthenticated, userData, idToken, accessToken, errorMessage }) => {
    /* ... */
  });
}

```

## Login using a Popup

You can authenticate with any Open ID Connect identity provider using a popup.

This allows you to have the provider's consent prompt display in a popup window to avoid unloading and reloading the app.

### Sample

```ts
  constructor(public oidcSecurityService: OidcSecurityService) {}

  loginWithPopup() {
    this.oidcSecurityService.authorizeWithPopUp().subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
      /* use data */
    });
  }
```

### AuthOptions & PopupOptions

You can pass options to control the dimension of the popup with the `PopupOptions` interface as a second parameter

```ts
loginWithPopup() {
  const somePopupOptions = { width: 500, height: 500, left: 50, top: 50 };

  const authOptionsOrNull = /* ... */

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
  const somePopupOptionsOrNull = /* ... */;

  const authOptionsOrNull = /* ... */

  this.oidcSecurityService.authorizeWithPopUp(authOptions, somePopupOptions, 'configId')
    .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
    /* ... */
    });
}
```

### Popup Sample

[app.component.ts](../../../../../projects/sample-code-flow-popup/src/app/app.component.ts)

## Logout

The `logoff()` function sends an end session request to the OIDC server, if it is available, or the check session has not sent a changed event.

```ts
logout() {
   this.oidcSecurityService.logoff();
}
```

### `ConfigId` Parameter

In case you have multiple configs you can pass the `configId` parameter as the first argument.

```ts
login() {
  this.oidcSecurityService.logoff('configId')
    .subscribe(({ isAuthenticated, userData, idToken, accessToken, errorMessage }) => {
    /* ... */
    });
}
```

### AuthOptions Parameter

You can pass an `authOptions` parameter if you want to control the behavior more.

```ts
logout() {
  const authOptions = {
    customParams: {
      some: 'params',
    },
    urlHandler: () => {
      /* ... */
    },
  };

  this.oidcSecurityService.logoff('configId', authOptions);
}
```

### `logoffAndRevokeTokens()`

The `logoffAndRevokeTokens()` function revokes the access token and the refresh token if using a refresh flow, and then logoff like above.

```ts
logoffAndRevokeTokens() {
   this.oidcSecurityService.logoffAndRevokeTokens()
      .subscribe((result) => console.log(result));
}
```

The method also takes a `configId` and a `authOptions` in case you want to pass this.

### `logoffLocal()`

The `logoffLocal()` function is used to reset you local session in the browser, but not sending anything to the server. It also supports the `configId` parameter.

```ts
logoutLocal() {
   this.oidcSecurityService.logoffLocal();
}
```
