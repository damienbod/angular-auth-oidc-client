---
sidebar_label: Custom Parameters
sidebar_position: 12
---

# Custom Parameters

Custom parameters can be added to the auth request by adding them to the config.

They are provided by:

```ts
customParamsAuthRequest?: {
    [key: string]: string | number | boolean;
};
```

And you can pass them as an object like this:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      config: {
        authority: '<your authority address here>',
        customParamsAuthRequest: {
          response_mode: 'fragment',
          prompt: 'consent',
        },
      },
    }),
  ],
};
```

## Dynamic custom parameters

If you want to pass dynamic custom parameters with the request URL to the Security Token Service, you can do this by passing the parameters into the `authorize` method:

```ts
login() {
  this.oidcSecurityService.authorize(undefined, { customParams: { ui_locales: 'de-CH' }});
}

```

> If you want to pass static parameters to the Security Token Service every time please use the custom parameters in the [Configuration](configuration.md) instead!

## Other requests

Custom parameters can also be added to the other requests of the library:

| Config property                   | Added to                                                |
| --------------------------------- | ------------------------------------------------------- |
| `customParamsAuthRequest`         | the authorize URL (and the PAR request)                 |
| `customParamsCodeRequest`         | the body of the token request that exchanges the code   |
| `customParamsRefreshTokenRequest` | the body of the refresh token request                   |
| `customParamsEndSessionRequest`   | the end session (logout) URL                            |

Parameters passed at runtime are merged over the configured ones, e.g. with `authorize(configId, { customParams })`, `forceRefreshSession(customParams)`, `logoff(configId, { customParams })` or `getEndSessionUrl(customParams)`.

## NgModule

If you want to use custom parameters in the `NgModule`, you can do this as follows:

```ts
AuthModule.forRoot({
  config: {
    authority: '<your authority address here>',
    customParamsAuthRequest: {
      response_mode: 'fragment',
      prompt: 'consent',
    },
  },
}),
```
