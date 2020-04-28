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

### [Code](../projects/sample-code-flow-http-config)

[App module](../projects/sample-code-flow-http-config/src/app/app.module.ts)

[App component](../projects/sample-code-flow-http-config/src/app/app.component.ts)

[App component html](../projects/sample-code-flow-http-config/src/app/app.component.html)

## Code Flow PKCE with Refresh tokens

### Code

[App module](http://github.com)
[App component](http://github.com)
[App component html](http://github.com)

## Code Flow PKCE Auto login

### Code

[App module](http://github.com)
[App component](http://github.com)
[App component html](http://github.com)
[Auto login component](http://github.com)
[Guard](http://github.com)

## Code Flow with PKCE basic with silent renew

### [Code](../projects/sample-code-flow)

[App module](../projects/sample-code-flow/src/app/app.module.ts)

[App component](../projects/sample-code-flow/src/app/app.component.ts)

[App component html](../projects/sample-code-flow/src/app/app.component.html)

## Implicit Flow with silent renew (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### Code

[App module](http://github.com)
[App component](http://github.com)
[App component html](http://github.com)

## Implicit Flow google (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### Code

[App module](http://github.com)
[App component](http://github.com)
[App component html](http://github.com)

## Implicit Flow Azure AD (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

### Code

[App module](http://github.com)
[App component](http://github.com)
[App component html](http://github.com)
