# Angular Lib for OpenID Connect & OAuth2

[![Build Status](https://github.com/damienbod/angular-auth-oidc-client/workflows/.github/workflows/build.yml/badge.svg?branch=main)] [![npm](https://img.shields.io/npm/v/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/dm/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/l/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![Coverage Status](https://coveralls.io/repos/github/damienbod/angular-auth-oidc-client/badge.svg?branch=master)](https://coveralls.io/github/damienbod/angular-auth-oidc-client?branch=master)

> OpenID Code Flow with PKCE, Code Flow with refresh tokens, OpenID Connect Implicit Flow

## OpenID Certification

This library is <a href="http://openid.net/certification/#RPs">certified</a> by OpenID Foundation. (RP Implicit and Config RP)

<a href="http://openid.net/certification/#RPs"><img src="https://damienbod.files.wordpress.com/2017/06/oid-l-certification-mark-l-rgb-150dpi-90mm.png" alt="" width="200" /></a>

## Features

-   Supports OpenID Connect Code Flow with PKCE
-   Supports Code Flow PKCE with Refresh tokens
-   Supports Revocation Endpoint
-   Support for current best practice
-   Implements OIDC validation as specified, complete client side validation for REQUIRED features
-   [Supports OpenID Connect Implicit Flow](http://openid.net/specs/openid-connect-implicit-1_0.html)
-   [OpenID Connect Session Management 1.0](http://openid.net/specs/openid-connect-session-1_0.html)
-   Samples for most of the common use cases

## Installation

Navigate to the level of your `package.json` and type

```typescript
 npm install angular-auth-oidc-client
```

or with yarn

```typescript
 yarn add angular-auth-oidc-client
```

## Documentation

-   [Quickstart](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/quickstart.md)
-   [Samples](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/samples.md)
-   [Silent renew](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/silent-renew.md)
-   [Guards](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/guards.md)
-   [Features](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/features.md)
-   [Logout](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/logout.md)
-   [Using and revoking the access token](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/using-access-tokens.md)
-   [CSP & CORS](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/csp-cors-config.md)
-   [Public API](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/public-api.md)
-   [Configuration](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/configuration.md)
-   [Migration](https://github.com/damienbod/angular-auth-oidc-client/tree/master/docs/migration.md)
-   [Changelog](https://github.com/damienbod/angular-auth-oidc-client/tree/master/CHANGELOG.md)

## Quickstart

> For the example of the Code Flow. For further examples please check the [Samples](docs/samples.md) Section

Import the module and services in your module.

```typescript
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AuthModule, LogLevel, OidcConfigService } from 'angular-auth-oidc-client';
// ...

export function configureAuth(oidcConfigService: OidcConfigService) {
    return () =>
        oidcConfigService.withConfig({
            stsServer: 'https://offeringsolutions-sts.azurewebsites.net',
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: 'angularClient',
            scope: 'openid profile email',
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: `${window.location.origin}/silent-renew.html`,
            logLevel: LogLevel.Debug,
        });
}

@NgModule({
    // ...
    imports: [
        // ...
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        {
            provide: APP_INITIALIZER,
            useFactory: configureAuth,
            deps: [OidcConfigService],
            multi: true,
        },
    ],
    // ...
})
export class AppModule {}
```

And call the method `checkAuth()` from your `app.component.ts`

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { OidcClientNotification, OidcSecurityService, PublicConfiguration } from 'angular-auth-oidc-client';
import { Observable } from 'rxjs';

@Component({
    /**/
})
export class AppComponent implements OnInit {
    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.oidcSecurityService.checkAuth().subscribe((auth) => console.log('is authenticated', auth));
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

```typescript
const token = this.oidcSecurityService.getToken();
```

And then you can use it in the HttpHeaders

```typescript
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
