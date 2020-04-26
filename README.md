# Angular Lib for OpenID Connect Code Flow with PKCE and Implicit Flow

[![Build Status](https://travis-ci.org/damienbod/angular-auth-oidc-client.svg?branch=master)](https://travis-ci.org/damienbod/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/v/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/dm/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client) [![npm](https://img.shields.io/npm/l/angular-auth-oidc-client.svg)](https://www.npmjs.com/package/angular-auth-oidc-client)

> OpenID Code Flow with PKCE, OpenID Connect Implicit Flow

## OpenID Certification

This library is <a href="http://openid.net/certification/#RPs">certified</a> by OpenID Foundation. (RP Implicit and Config RP)

<a href="http://openid.net/certification/#RPs"><img src="https://damienbod.files.wordpress.com/2017/06/oid-l-certification-mark-l-rgb-150dpi-90mm.png" alt="" width="200" /></a>

## Features

-   version 4.1.0 Angular 4 to Angular 5.2.10, Version 6.0.0, Angular 6 onwards
-   Supports OpenID Connect Code Flow with PKCE
-   Supports OpenID Connect Implicit Flow http://openid.net/specs/openid-connect-implicit-1_0.html
-   Complete client side validation for REQUIRED features
-   OpenID Connect Session Management 1.0 http://openid.net/specs/openid-connect-session-1_0.html
-   AOT build
-   Can be lazy loaded

Documentation : [Quickstart](https://github.com/damienbod/angular-auth-oidc-client) | [API Documentation](https://github.com/damienbod/angular-auth-oidc-client/blob/master/API_DOCUMENTATION.md) | [Changelog](https://github.com/damienbod/angular-auth-oidc-client/blob/master/CHANGELOG.md)

## Installation

Navigate to the level of your `package.json` and type

```typescript
 npm install angular-auth-oidc-client
```

or with yarn

```typescript
 yarn add angular-auth-oidc-client
```

## Configuration

[Configuration examples](docs/configuration.md)

## Usage

### Code Flow with PKCE

> It is recomended flow in SPA applications, see [SECURELY USING THE OIDC AUTHORIZATION CODE FLOW AND A PUBLIC CLIENT WITH SINGLE PAGE APPLICATIONS](https://medium.com/@robert.broeckelmann/securely-using-the-oidc-authorization-code-flow-and-a-public-client-with-single-page-applications-55e0a648ab3a).
>
> Not all security service providers and servers support it yet.

Create the login, logout component and use the oidcSecurityService

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { filter, take } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
    isAuthenticated: boolean;
    userData: any;

    constructor(public oidcSecurityService: OidcSecurityService) {
        if (this.oidcSecurityService.moduleSetup) {
            this.doCallbackLogicIfRequired();
        } else {
            this.oidcSecurityService.onModuleSetup.subscribe(() => {
                this.doCallbackLogicIfRequired();
            });
        }
    }

    ngOnInit() {
        this.oidcSecurityService.getIsAuthorized().subscribe((auth) => {
            this.isAuthenticated = auth;
        });

        this.oidcSecurityService.getUserData().subscribe((userData) => {
            this.userData = userData;
        });
    }

    ngOnDestroy(): void {}

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }

    private doCallbackLogicIfRequired() {
        // Will do a callback, if the url has a code and state parameter.
        this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
    }
}
```

#### Implicit Flow (Not recommended)

This flow is no longer recommended, but some servers support this flow only, and not the Code flow with PKCE.

Create the login, logout component and use the oidcSecurityService

```typescript
private doCallbackLogicIfRequired() {
  if (window.location.hash) {
    this.oidcSecurityService.authorizedImplicitFlowCallback();
  }
  }
```

And a simple template for the component.

```typescript
<button *ngIf="!isAuthenticated" (click)="login()">Login</button>
<button *ngIf="isAuthenticated" (click)="logout()">Logout</button>

<hr />

Is Authenticated: {{ isAuthenticated }}

<br />
<br />

{{ userData | json }}

```

## Silent Renew

When silent renew is enabled, a DOM event will be automatically installed in the application's host window.
The event `oidc-silent-renew-message` accepts a `CustomEvent` instance with the token returned from the OAuth server
in its `detail` field.
The event handler will send this token to the authorization callback and complete the validation.

Point the `silent_renew_url` property to an HTML file which contains the following script element to enable authorization.

### Code Flow with PKCE

```javascript
<script>
	window.onload = function () {
		/* The parent window hosts the Angular application */
		var parent = window.parent;
		/* Send the id_token information to the oidc message handler */
		var event = new CustomEvent('oidc-silent-renew-message', { detail: window.location });
		parent.dispatchEvent(event);
	};
</script>
```

### Silent Renew Angular-CLI

Add the silent-renew.html file to the angular.json assets configuration

```javascript
"assets": [
              "projects/sample-code-flow/src/silent-renew.html",
              "projects/sample-code-flow/src/favicon.ico",
              "projects/sample-code-flow/src/assets"
            ],
```

## Using the access_token

In the http services, add the token to the header using the oidcSecurityService

```typescript
private setHeaders() {
	this.headers = new HttpHeaders();
	this.headers = this.headers.set('Content-Type', 'application/json');
	this.headers = this.headers.set('Accept', 'application/json');

	const token = this._securityService.getToken();
	if (token !== '') {
		const tokenValue = 'Bearer ' + token;
		this.headers = this.headers.set('Authorization', tokenValue);
	}
}
```

## Using Guards

```typescript
import { Injectable } from '@angular/core';
import { Router, Route, CanActivate, CanLoad, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable()
export class AuthorizationGuard implements CanActivate, CanLoad {
    constructor(private router: Router, private oidcSecurityService: OidcSecurityService) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.checkUser();
    }

    canLoad(state: Route): Observable<boolean> {
        return this.checkUser();
    }

    private checkUser(): Observable<boolean> {
        return this.oidcSecurityService.getIsAuthorized().pipe(
            map((isAuthorized: boolean) => {
                if (!isAuthorized) {
                    this.router.navigate(['/unauthorized']);
                    return false;
                }
                return true;
            })
        );
    }
}
```

### Note about Guards

The guard should only be applied to protected URLs. The guard should not be active on the default route, where the authorization request is processed.

## Adding custom parameters to the authorization request

Custom parameters can be added to the auth request by using the setCustomRequestParameters method. Here you could add ui_locale, acr or whatever you request for your token server.

```typescript
this.oidcSecurityService.setCustomRequestParameters({ ui_locales: culture });
```

## Custom Storage

If you need, you can create a custom storage (for example to use cookies).

Implement `OidcSecurityStorage` class-interface and the `read` and `write` methods:

```typescript
@Injectable()
export class CustomStorage implements OidcSecurityStorage {

    public read(key: string): any {
        ...
        return ...
    }

    public write(key: string, value: any): void {
        ...
    }

}
```

Then provide the class in the module:

```typescript
@NgModule({
    imports: [
        ...
        AuthModule.forRoot({ storage: CustomStorage })
    ],
    ...
})
```

See also `oidc.security.storage.ts` for an example.

## Http Interceptor

The HttpClient allows you to write [interceptors](https://angular.io/guide/http#intercepting-all-requests-or-responses). A common usecase would be to intercept any outgoing HTTP request and add an authorization header. Keep in mind that injecting OidcSecurityService into the interceptor via the constructor results in a cyclic dependency. To avoid this use the [injector](https://angular.io/api/core/Injector) instead.

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private oidcSecurityService: OidcSecurityService;

    constructor(private injector: Injector) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let requestToForward = req;

        if (this.oidcSecurityService === undefined) {
            this.oidcSecurityService = this.injector.get(OidcSecurityService);
        }
        if (this.oidcSecurityService !== undefined) {
            let token = this.oidcSecurityService.getToken();
            if (token !== '') {
                let tokenValue = 'Bearer ' + token;
                requestToForward = req.clone({ setHeaders: { Authorization: tokenValue } });
            }
        } else {
            console.debug('OidcSecurityService undefined: NO auth header!');
        }

        return next.handle(requestToForward);
    }
}
```

## Authorizing in a popup or iframe

You can call the Provider's authorization endpoint in a popup or iframe instead of navigating to it in the app's parent window.
This allows you to have the Provider's consent prompt display in a popup window to avoid unloading and reloading the app,
or to authorize the user silently by loading the endpoint in a hidden iframe if that supported by the Provider.

To get the fully-formed authorization URL, pass a handler function to `OidcSecurityService.authorize`
(this will also prevent the default behavior of loading the authorization endpoint in the current window):

```typescript
login() {
    this.oidcSecurityService.authorize((authUrl) => {
        // handle the authorrization URL
        window.open(authUrl, '_blank', 'toolbar=0,location=0,menubar=0');
    });
}
```

### Silent Renew Implicit Flow

```javascript
<script>
    window.onload = function () {
    /* The parent window hosts the Angular application */
    var parent = window.parent;
    /* Send the id_token information to the oidc message handler */
    var event = new CustomEvent('oidc-silent-renew-message', {detail: window.location.hash.substr(1) });
    parent.dispatchEvent(event);
};
</script>
```

When silent renew is enabled, `getIsAuthorized()` will attempt to perform a renew before returning the authorization state.
This allows the application to authorize a user, that is already authenticated, without redirects.

Silent renew requires CSP configuration, see next section.

## X-Frame-Options / CSP ancestor / different domains

If deploying the client application and the STS server application with 2 different domains,
the X-Frame-Options HTTPS header needs to allow all iframes. Then use the CSP HTTPS header to only allow the required domains.
**The silent renew requires this.**

Add this header to responses from the server that serves your SPA:

```
Content-Security-Policy: script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data:;font-src 'self';frame-ancestors 'self' https://localhost:44318;block-all-mixed-content
```

where `https://localhost:44318` is the address of your STS server.

e.g. if you use NginX to serve your Angular application, it would be

```
http {
  server {
    ...
    add_header Content-Security-Policy "script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data:;font-src 'self';frame-ancestors 'self' https://localhost:44318;block-all-mixed-content";
```

## Examples using:

https://github.com/damienbod/AspNetCoreAngularSignalRSecurity

https://github.com/damienbod/dotnet-template-angular

https://github.com/damienbod/angular-auth-oidc-sample-google-openid

https://github.com/HWouters/ad-b2c-oidc-angular

### Using src code directly:

https://github.com/damienbod/AspNet5IdentityServerAngularImplicitFlow

## License

MIT
