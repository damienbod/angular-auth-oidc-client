---
sidebar_label: Custom Parameters
sidebar_position: 9
---

# Custom parameters

Custom parameters can be added to the auth request by adding them to the config. They are provided by

```ts
customParamsAuthRequest?: {
    [key: string]: string | number | boolean;
};
```

so you can pass them as an object like this:

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

## Dynamic custom parameters

If you want to pass dynamic custom parameters with the request url to the secure token server, you can do this by passing the parameters into the `authorize` method.

```ts
login() {
    this.oidcSecurityService.authorize(null, { customParams: { ui_locales: 'de-CH' }});
}

```

> If you want to pass static parameters to the secure token server every time please use the custom parameters in the [Configuration](configuration.md) instead!
