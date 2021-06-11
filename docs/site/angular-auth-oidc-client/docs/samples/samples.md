# Samples using this library

## Code flow PKCE with Refresh tokens

The Code flow with PKCE uses refresh tokens to refresh the session and a the end of the session, the user can logout and revoke the tokens. The demo is setup to use each refresh token only once.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-refresh-tokens)

## Code flow with PKCE Using a configuration from an http source and iframe renew

Sometimes it is required to load the configuration from an http address. You can load the config from your source and map it into the required format using the loader property on the `.forRoot` config.

The properties used in this example are just for demo purposes, you can used any definitions.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-http-config)

## Code flow PKCE Auto login

The example logins the user in directly without a login click using the Code Flow with PKCE and an Auth Guard.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-auto-login)

## Popup Code flow with PKCE

Popup Code Flow with PKCE.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-popup)

## Azure AD OIDC Code flow with PKCE

Azure AD sample using OpenID Connect Code Flow with PKCE and refresh tokens

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-azuread)

## Auth0 AD OIDC Code flow with PKCE and refresh tokens

Auth0 sample using OpenID Connect Code Flow with PKCE and refresh tokens

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-auth0)

## Code flow with pushed authorization request (PAR)

example using OAuth pushed authorization requests

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-par)

## Multiple configurations Code flow with PKCE refresh tokens using Auth0, IdentityServer4

The is the multiple configurations which uses Auth0 with refresh tokens for one configuration and IdentityServer4 for the second.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-Auth0-ID4)

## Multiple configurations Code flow popup with PKCE refresh tokens using Auth0, IdentityServer4

The is the multiple configurations which uses Auth0 with refresh tokens for one configuration and IdentityServer4 for the second.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-Auth0-ID4-popup)

## Multiple configurations Azure AD OIDC Code flow with PKCE

Multiple configurations Azure AD sample using OpenID Connect Code Flow with PKCE and refresh tokens. This can be used for implementations using graph API or multiple APIs

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/projects/sample-code-flow-multi-AAD)

## Multiple configurations Code flow with PKCE basic with iframe renew

The is the basic example of the Code Flow with PKCE.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-iframe)

## Azure B2C Code flow PKCE with Silent renew

The example uses the Code Flow PKCE with Silent renew with Azure B2C as the STS.

### [Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-azure-b2c)

## Implicit flow with silent renew (Not recommended)

The example uses the Implicit Flow with silent renew. This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-implicit-flow-silent-renew)

## Implicit flow google (Not recommended)

The example uses the Implicit Flow with silent renew with google. This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-implicit-flow-google)

## Code flow with a lazy loaded module

The example uses the Code flow with silent renew but you authenticate in a lazy loaded module

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-lazy-loaded)
