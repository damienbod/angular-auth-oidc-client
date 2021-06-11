# Angular Lib for OpenID Connect & OAuth2

![Build Status](https://github.com/damienbod/angular-auth-oidc-client/workflows/angular-auth-oidc-client-build/badge.svg?branch=main) [![npm](https://img.shields.io/npm/v/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/dm/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/l/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![Coverage Status](https://coveralls.io/repos/github/damienbod/angular-auth-oidc-client/badge.svg?branch=main)](https://coveralls.io/github/damienbod/angular-auth-oidc-client?branch=main)

> OpenID Code Flow with PKCE, Code Flow with refresh tokens, OpenID Connect Implicit Flow

## OpenID Certification

This library is <a href="http://openid.net/certification/#RPs">certified</a> by OpenID Foundation. (RP Implicit and Config RP)

<a href="http://openid.net/certification/#RPs"><img src="https://damienbod.files.wordpress.com/2017/06/oid-l-certification-mark-l-rgb-150dpi-90mm.png" alt="" width="200" /></a>

## Features

- Samples for most of the common use cases
- `ng add` support
- Supports all modern OIDC identity providers
- Supports OpenID Connect Code Flow with PKCE
- Supports Code Flow PKCE with Refresh tokens
- [Supports OpenID Connect Implicit Flow](http://openid.net/specs/openid-connect-implicit-1_0.html)
- [Supports OpenID Connect Session Management 1.0](http://openid.net/specs/openid-connect-session-1_0.html)
- [Supports RFC7009 - OAuth 2.0 Token Revocation](https://tools.ietf.org/html/rfc7009)
- [Supports RFC7636 - Proof Key for Code Exchange (PKCE)](https://tools.ietf.org/html/rfc7636)
- [Supports OAuth 2.0 Pushed authorisation requests (PAR) draft](https://tools.ietf.org/html/draft-ietf-oauth-par-06)
- Support for current best practice
- Semantic releases
- Github actions
- Modern coding guidelines with prettier, husky
- Up to date documentation
- Implements OIDC validation as specified, complete client side validation for REQUIRED features
- Supports authenticiation using redirect or popup

## Installation

### Ng Add

You can use the schematics and `ng add` the library.

```
ng add angular-auth-oidc-client
```

And answer the questions. A module will be created which encapsulates your configuration.

![angular-auth-oidc-client schematics](./.github/angular-auth-oidc-client-schematics-720.gif)

### Npm / Yarn

Navigate to the level of your `package.json` and type

```ts
 npm install angular-auth-oidc-client
```

or with yarn

```ts
 yarn add angular-auth-oidc-client
```

## Documentation

- [Quickstart](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/quickstart.md)
- [Samples](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/samples.md)

  - [Code flow PKCE with refresh tokens](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-refresh-tokens)
  - [Code flow with PKCE using a configuration from an HTTP source and iframe renew](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-http-config)
  - [Code flow PKCE auto-login](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-auto-login)
  - [Code flow using popup with PKCE](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-popup)
  - [Azure AD OIDC code flow with PKCE](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-azuread)
  - [Auth0 OpenID Connect code flow with PKCE and refresh tokens](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-auth0)
  - [Code flow with pushed authorization request (PAR) node-oidc-provider](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-par)
  - [Multiple configurations code flow with PKCE refresh tokens using Auth0, IdentityServer4](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-Auth0-ID4)
  - [Multiple configurations code flow popup with PKCE refresh tokens using Auth0, IdentityServer4](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-Auth0-ID4-popup)
  - [Multiple configurations Azure AD OpenID Connect code flow with PKCE](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/projects/sample-code-flow-multi-AAD)
  - [Multiple configurations code flow with PKCE basic with iframe renew](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-multi-iframe)
  - [Azure B2C code flow PKCE with Silent renew](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-code-flow-azure-b2c)
  - [Implicit flow with silent renew (Not recommended)](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-implicit-flow-silent-renew)
  - [Implicit flow google (Not recommended)](https://github.com/damienbod/angular-auth-oidc-client/tree/main/projects/sample-implicit-flow-google)

- [Guards](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/guards.md)
- [Features](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/features.md)

  - [Public Events](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/features.md#public-events)
  - [Auth with a popup](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/authorizing-popup.md)
  - [Custom Storage](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/features.md#custom-storage)
  - [Custom parameters](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/features.md#custom-parameters)
  - [Auto Login](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/features.md#auto-login)
  - [Using the OIDC package in a module or a Angular lib](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/features.md#using-the-oidc-package-in-a-module-or-a-angular-lib)
  - [Delay the loading or pass an existing AuthWellKnownEndpoints config](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/features.md#delay-the-loading-or-pass-an-existing-well-knownopenid-configuration-configuration)

- [Logout](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/logout.md)
- [Using and revoking the access token](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/using-access-tokens.md)
- [CSP & CORS](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/csp-cors-config.md)
- [Public API](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/public-api.md)
- [Configuration](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/configuration.md)
- [Migration](https://github.com/damienbod/angular-auth-oidc-client/tree/main/docs/migration.md)
- [Changelog](https://github.com/damienbod/angular-auth-oidc-client/tree/main/CHANGELOG.md)

## Quickstart

> For the example of the Code Flow. For further examples please check the [Samples](docs/samples.md) Section

> NOTE If you have done the installation with the schematics, these modules and files should be available already!!!

If the schematics did not do this already: Import the `AuthModule` in your module.

```ts
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';
// ...

@NgModule({
  // ...
  imports: [
    // ...
    AuthModule.forRoot({
      config: {
        stsServer: '<your sts address here>',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: 'angularClient',
        scope: 'openid profile email',
        responseType: 'code',
        silentRenew: true,
        silentRenewUrl: `${window.location.origin}/silent-renew.html`,
        logLevel: LogLevel.Debug,
      },
    }),
  ],
  // ...
})
export class AppModule {}
```

And call the method `checkAuth()` from your `app.component.ts`. The method `checkAuth()` is needed to process the redirect from your sts and set the correct states. This method must be used to ensure the correct functioning of the library.

```ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
  /**/
})
export class AppComponent implements OnInit {
  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService
      .checkAuth()
      .subscribe(({ isAuthenticated, userData, accessToken }) => console.log('is authenticated', isAuthenticated));
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff();
  }
}
```

## Using the access token

You can get the access token by calling the method `getToken()` on the `OidcSecurityService`

```ts
const token = this.oidcSecurityService.getToken();
```

And then you can use it in the HttpHeaders

```ts
import { HttpHeaders } from '@angular/common/http';

const token = this.oidcSecurityServices.getToken();

const httpOptions = {
  headers: new HttpHeaders({
    Authorization: 'Bearer ' + token,
  }),
};
```

## License

MIT

## Version 10

if you need information about version 10 please search here

https://github.com/damienbod/angular-auth-oidc-client/tree/version-10
