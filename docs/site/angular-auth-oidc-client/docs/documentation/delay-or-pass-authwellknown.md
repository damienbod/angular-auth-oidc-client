---
sidebar_label: Delay or pass .well-known/openid-configuration
sidebar_position: 11
---

# Delay the loading or pass an existing .well-known/openid-configuration

The Security Token Service `.well-known/openid-configuration` configuration can be requested via an HTTPS call when starting the application. This HTTPS call may affect your first page loading time. You can disable this and configure the loading of the `.well-known/openid-configuration` later, just before you start the authentication process. You as a user, can decide when you want to request the well known endpoints.

The property `eagerLoadAuthWellKnownEndpoints` in the configuration sets exactly this. The default is set to `true`, so the `.well-known/openid-configuration` is loaded at the start as in previous versions. Setting this to `false` the `.well-known/openid-configuration` will be loaded when the user starts the authentication.

You also have the option to pass the already existing `.well-known/openid-configuration` into the module as a second parameter. In this case no HTTPS call to load the `.well-known/openid-configuration` will be made.

```ts
AuthModule.forRoot({
  config: {
    // ...
    eagerLoadAuthWellKnownEndpoints: true | false,
    authWellknownEndpoints: {
      // ...
    }
  },
}),
```
