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

Sometimes it is required to load a custom `.well-known/openid-configuration` from an http adress. You can load the config from your source, map it into the required format and use the `withConfig(...)` method as usual.

> There properties are just an example, you have to use yours if you are choosing this way of configuring

### [src code](../projects/sample-code-flow-http-config)

[app.module.ts](../projects/sample-code-flow-http-config/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow-http-config/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow-http-config/src/app/app.component.html)

## Code Flow PKCE with Refresh tokens

### [src code](../projects/sample-code-flow-refresh-tokens)

[app.module.ts](../projects/sample-code-flow-refresh-tokens/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow-refresh-tokens/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow-refresh-tokens/src/app/app.component.html)

## Code Flow PKCE Auto login

### [src code](../projects/sample-code-flow-auto-login)

[app.module.ts](../projects/sample-code-flow-auto-login/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow-auto-login/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow-auto-login/src/app/app.component.html)

[auto-login.component.ts](../projects/sample-code-flow-auto-login/src/app/auto-login/auto-login.component.ts)

[guard.ts](../projects/sample-code-flow-auto-login/src/app/authorization.guard.ts)

## Code Flow with PKCE basic with silent renew

### [src code](../projects/sample-code-flow)

[app.module.ts](../projects/sample-code-flow/src/app/app.module.ts)

[app.component.ts](../projects/sample-code-flow/src/app/app.component.ts)

[app.component.html](../projects/sample-code-flow/src/app/app.component.html)

## Implicit Flow with silent renew (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### [src code](../projects/sample-implicit-flow-silent-renew)

[app.module.ts](../projects/sample-implicit-flow-silent-renew/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-silent-renew/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-silent-renew/src/app/app.component.html)

## Implicit Flow google (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### [src code](../projects/sample-implicit-flow-google)

[app.module.ts](../projects/sample-implicit-flow-google/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-google/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-google/src/app/app.component.html)

## Implicit Flow Azure AD (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### [src code](../projects/sample-implicit-flow-azuread)

[app.module.ts](../projects/sample-implicit-flow-azuread/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-azuread/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-azuread/src/app/app.component.html)

## Implicit Flow Azure B2C (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### [src code](../projects/sample-implicit-flow-ad-b2c)

[app.module.ts](../projects/sample-implicit-flow-ad-b2c/src/app/app.module.ts)

[app.component.ts](../projects/sample-implicit-flow-ad-b2c/src/app/app.component.ts)

[app.component.html](../projects/sample-implicit-flow-ad-b2c/src/app/app.component.html)
