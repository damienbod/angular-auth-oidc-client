# Samples using this library

-   [Code Flow with PKCE Using a configuration from an http source and silent renew](#code-flow-with-pkce-using-a-configuration-from-an-http-source-and-silent-renew)
-   [Code Flow PKCE with Refresh tokens](#code-flow-pkce-with-refresh-tokens)
-   [Code Flow PKCE Auto login](#code-flow-pkce-auto-login)
-   [Code Flow with PKCE basic with silent renew](#code-flow-with-pkce-basic-with-silent-renew)
-   [Implicit Flow with silent renew (Not recommended)](#implicit-flow-with-silent-renew-not-recommended)
-   [Implicit Flow google (Not recommended)](#implicit-flow-google-not-recommended)
-   [Implicit Flow Azure AD (Not recommended)](#implicit-flow-azure-ad-not-recommended)
-   [Implicit Flow Azure B2C (Not recommended)](#implicit-flow-azure-b2c-not-recommended)

## Code Flow with PKCE Using a configuration from an http source and silent renew

Sometimes it is required to load the configuration from an http address. You can load the config from your source, map it into the required format and use the `withConfig(...)` function.

The properties used in this example are just for demo purposes, you can used any definitions.

### [src code](../projects/sample-code-flow-http-config)

[app.module.ts](../projects/sample-code-flow-http-config/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow-http-config/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow-http-config/src/app/app.component.html)

## Code Flow PKCE with Refresh tokens

The Code flow with PKCE uses refresh tokens to refresh the session and a the end of the session, the user can logout and revoke the tokens. The demo is setup to use each refresh token only once.

### [src code](../projects/sample-code-flow-refresh-tokens)

[app.module.ts](../projects/sample-code-flow-refresh-tokens/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow-refresh-tokens/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow-refresh-tokens/src/app/app.component.html)

## Code Flow PKCE Auto login

The example logins the user in directly without a login click using the Code Flow with PKCE and an Auth Guard.

### [src code](../projects/sample-code-flow-auto-login)

[app.module.ts](../projects/sample-code-flow-auto-login/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow-auto-login/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow-auto-login/src/app/app.component.html)

[auto-login.component.ts](../projects/sample-code-flow-auto-login/src/app/auto-login/auto-login.component.ts)

[guard.ts](../projects/sample-code-flow-auto-login/src/app/authorization.guard.ts)

## Code Flow with PKCE basic with silent renew

The is the basic example of the Code Flow with PKCE.

### [src code](../projects/sample-code-flow)

[app.module.ts](../projects/sample-code-flow/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow/src/app/app.component.html)

## Implicit Flow with silent renew (Not recommended)

The example uses the Implicit Flow with silent renew. This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

### [src code](../projects/sample-implicit-flow-silent-renew)

[app.module.ts](../projects/sample-implicit-flow-silent-renew/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-silent-renew/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-silent-renew/src/app/app.component.html)

## Implicit Flow google (Not recommended)

The example uses the Implicit Flow with silent renew with google. This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

### [src code](../projects/sample-implicit-flow-google)

[app.module.ts](../projects/sample-implicit-flow-google/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-google/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-google/src/app/app.component.html)

## Implicit Flow Azure AD (Not recommended)

The example uses the Implicit Flow with silent renew with Azure AD. This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

### [src code](../projects/sample-implicit-flow-azuread)

[app.module.ts](../projects/sample-implicit-flow-azuread/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-azuread/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-azuread/src/app/app.component.html)

## Implicit Flow Azure B2C (Not recommended)

The example uses the Implicit Flow with silent renew with Azure B2C. This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

### [src code](../projects/sample-implicit-flow-ad-b2c)

[app.module.ts](../projects/sample-implicit-flow-ad-b2c/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-ad-b2c/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-ad-b2c/src/app/app.component.html)

## Code flow with a lazy loaded module

The example uses the Code flow with silent renew but you authenticate in a lazy loaded module

### [src code](../projects/sample-code-flow-lazy-loaded)

[app.module.ts](../projects/sample-code-flow-lazy-loaded/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow-lazy-loaded/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow-lazy-loaded/src/app/app.component.html)

[lazy.component.ts](../projects/sample-code-flow-lazy-loaded/src/app/lazy/lazy.component.ts)

[lazy.component.html](../projects/sample-code-flow-lazy-loaded/src/app/lazy/lazy.component.html)
