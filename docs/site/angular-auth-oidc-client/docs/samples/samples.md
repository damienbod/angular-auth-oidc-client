# Samples using this library

## Code flow PKCE with refresh tokens

The OpenID Connect code flow with PKCE uses refresh tokens to refresh the session and at the end of the session, the user can logout and revoke the tokens. The demo is setup to use each refresh token only once.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-refresh-tokens)

## Code flow with PKCE using a configuration from an HTTP source and iframe renew

Sometimes it is required to load the configuration from an HTTP address. You can load the configuration from your source and map it into the required format using the loader property on the `.forRoot` config.

The properties used in this example are just for demo purposes, you can used any definitions.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-http-config)

## Code flow PKCE auto-login

The example logins the user in directly without a login click using the code flow with PKCE and an auth-guard.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-auto-login)

## Code flow using popup with PKCE

Popup OpenID Connect code flow with PKCE.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-popup)

## Azure AD OIDC code flow with PKCE

Azure AD sample using OpenID Connect code flow with PKCE and refresh tokens. Please refer to the multiple configurations sample if you require Graph API in the UI, or a second API.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-azuread)

## Auth0 OpenID Connect code flow with PKCE and refresh tokens

Auth0 sample using OpenID Connect code flow with PKCE and refresh tokens

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-auth0)

## Code flow with pushed authorization request (PAR) node-oidc-provider

example using OAuth pushed authorization requests. Identity provider is implemented using node-oidc-provider

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-par)

## Multiple configurations code flow with PKCE refresh tokens using Auth0, IdentityServer4

The is a multiple configurations sample which uses Auth0 with refresh tokens for one configuration and IdentityServer4 for the second.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-Auth0-ID4)

## Multiple configurations code flow popup with PKCE refresh tokens using Auth0, IdentityServer4

The is the multiple configurations sample which uses Auth0 with refresh tokens for one configuration and IdentityServer4 for the second. Popups are used to authentication.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-Auth0-ID4-popup)

## Multiple configurations Azure AD OpenID Connect code flow with PKCE

Multiple configurations Azure AD sample using OpenID Connect code flow with PKCE and refresh tokens. This can be used for implementations using Microsoft Graph API or multiple APIs

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/projects/sample-code-flow-multi-AAD)

## Multiple configurations code flow with PKCE basic with iframe renew

The is a multiple configurations sample using code flow with PKCE and iframe renew.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-iframe)

## Azure B2C code flow PKCE with Silent renew

The sample uses the code flow PKCE and iframe renew with Azure B2C as the STS.

### [Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-azure-b2c)

## Implicit flow with silent renew (Not recommended)

The example uses the Open ID Connect implicit flow with iframe renew. This flow is no longer recommended, but some servers support this flow only, and not the code flow with PKCE.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-implicit-flow-silent-renew)

## Implicit flow google (Not recommended)

The example uses the implicit flow with silent renew with google. This flow is no longer recommended, but some servers support this flow only, and not the code flow with PKCE.

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-implicit-flow-google)

## Code flow with a lazy loaded module

The example uses the code flow with silent renew but you authenticate in a lazy loaded module

[Code](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-lazy-loaded)
