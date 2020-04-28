# Angular Lib for OpenID Connect Code Flow with PKCE and Implicit Flow

[![Build Status](https://travis-ci.org/damienbod/angular-auth-oidc-client.svg?branch=master)](https://travis-ci.org/damienbod/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/v/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/dm/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/l/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client)

> OpenID Code Flow with PKCE, Code Flow with refresh tokens, OpenID Connect Implicit Flow

## OpenID Certification

This library is <a href="http://openid.net/certification/#RPs">certified</a> by OpenID Foundation. (RP Implicit and Config RP)

<a href="http://openid.net/certification/#RPs"><img src="https://damienbod.files.wordpress.com/2017/06/oid-l-certification-mark-l-rgb-150dpi-90mm.png" alt="" width="200" /></a>

## Features

-   Supports OpenID Connect Code Flow with PKCE
-   Supports Code Flow PKCE with Refresh tokens
-   Revocation Enpoint
-   [Supports OpenID Connect Implicit Flow](http://openid.net/specs/openid-connect-implicit-1_0.html)
-   Complete client side validation for REQUIRED features
-   [OpenID Connect Session Management 1.0](http://openid.net/specs/openid-connect-session-1_0.html)

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

-   [Quickstart](docs/quickstart.md)
-   [Samples](docs/samples.md)
-   [Silent renew](docs/silent-renew.md)
-   [Guards](docs/guards.md)
-   [Features](docs/features.md)
-   [Logout](docs/logout.md)
-   [Using and revoking the access token](docs/using-access-tokens.md)
-   [CSP & CORS](docs/csp-cors-config.md)
-   [Public API](docs/public-api.md)
-   [Configuration](docs/configuration.md)
-   [Migration](docs/migration.md)
-   [Changelog](CHANGELOG.md)

## Quickstart

> For the example of the Code Flow. For further examples please check the [Samples](Samples.md) Section

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
            redirectUrl: 'https://localhost:4200',
            postLogoutRedirectUri: 'https://localhost:4200',
            clientId: 'angularClient',
            scope: 'openid profile email',
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: 'https://localhost:4200/silent-renew.html',
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
    /***/
})
export class AppComponent implements OnInit {
    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.oidcSecurityService.checkAuth().subscribe((isAuthenticated) => console.log('app authenticated', isAuthenticated));
    }

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }
}
```

## Using the token to send with every HTTP request

In the interceptors of HTTP, add the token to the header using the `getToken()` method of the `OidcSecurityService`

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private oidcSecurityService: OidcSecurityService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.oidcSecurityService.getToken();

        if (token) {
            request = request.clone({
                headers: request.headers.set('Authorization', 'Bearer ' + token),
            });
        }
        return next.handle(request);
    }
}
```

## License

MIT

## Contributors
