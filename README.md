# angular-auth-oidc-client
[![Build Status](https://travis-ci.org/damienbod/angular-auth-oidc-client.svg?branch=master)](https://travis-ci.org/damienbod/angular-auth-oidc-client) 
>OpenID Connect Implicit Flow


## Features
- Angular 4 onwards
- Supports OpenID Implicit Flow http://openid.net/specs/openid-connect-implicit-1_0.html
- Complete client side validation for REQUIRED features
- OpenID Connect Session Management 1.0 http://openid.net/specs/openid-connect-session-1_0.html
- AOT build
- Can be lazy loaded

Documentation : [Quickstart](https://github.com/damienbod/angular-auth-oidc-client) | [API Documentation](https://github.com/damienbod/angular-auth-oidc-client/blob/master/API_DOCUMENTATION.md) | [Changelog](https://github.com/damienbod/angular-auth-oidc-client/blob/master/CHANGELOG.md)

## <a></a>Using the package

Navigate to the level of your package.json and type
``` javascript
 npm install angular-auth-oidc-client --save
```

or with yarn

``` javascript
 yarn add angular-auth-oidc-client
```

or you can add the npm package to your package.json
``` javascript
 "angular-auth-oidc-client": "1.0.6"
```
 
and type 

``` javascript
 npm install
```

## Using in the angular application

Import the module and services in your module. Set the AuthConfiguration properties to match the server configuration. At present only the id_token token flow is supported.

```typescript
import { NgModule } from '@angular/core';

import { AuthModule, AuthConfiguration } from 'angular-auth-oidc-client';

@NgModule({
    imports: [
        ...
        AuthModule.forRoot()
    ],
    ...
})

export class AppModule {
    constructor(public authConfiguration: AuthConfiguration) {
        this.authConfiguration.stsServer = 'https://localhost:44318';
        this.authConfiguration.redirect_url = 'https://localhost:44311';
        // The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience.
        // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.
        this.authConfiguration.client_id = 'angularclient';
        this.authConfiguration.response_type = 'id_token token';
        this.authConfiguration.scope = 'dataEventRecords securedFiles openid';
        this.authConfiguration.post_logout_redirect_uri = 'https://localhost:44311/Unauthorized';
        this.authConfiguration.start_checksession = false;
        this.authConfiguration.silent_renew = true;
        this.authConfiguration.startup_route = '/dataeventrecords/list';

        // *OPTIONAL* - some implementations require you to provide resource (e.g. client id or resource name) along with the request. provide it here. 
        this.authConfiguration.resource ='';

        // HTTP 403
        this.authConfiguration.forbidden_route = '/Forbidden';
        // HTTP 401
        this.authConfiguration.unauthorized_route = '/Unauthorized';
        this.authConfiguration.log_console_warning_active = true;
        this.authConfiguration.log_console_debug_active = false;
        // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
        // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
        this.authConfiguration.max_id_token_iat_offset_allowed_in_seconds = 3;
    }

}

```

Create the login, logout component and use the oidcSecurityService

```typescript
  constructor(public oidcSecurityService: OidcSecurityService) {
    }

    ngOnInit() {
        if (window.location.hash) {
            this.oidcSecurityService.authorizedCallback();
        }
    }

    login() {
        console.log('start login');
        this.oidcSecurityService.authorize();
    }

    refreshSession() {
        console.log('start refreshSession');
        this.oidcSecurityService.authorize();
    }

    logout() {
        console.log('start logoff');
        this.oidcSecurityService.logoff();
    }

```

In the http services, add the token to the header using the oidcSecurityService

```typescript
private setHeaders() {
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');
        this.headers.append('Accept', 'application/json');

        let token = this.oidcSecurityService.getToken();
        if (token !== '') {
            let tokenValue = 'Bearer ' + token;
            this.headers.append('Authorization', tokenValue);
        }
    }

```

## Storage

For example, you can get angular-auth-oidc-client to store access tokens in Cookies by downloading and adding Cookie-Storage to your project, creating a factory method to provide it:

let cookieStorageFactory = () => {
return new CookieStorage();
}

..and then adding it to the providers array in @NgModule:
{ provide: Storage, useFactory: cookieStorageFactory }


## Example using: 

https://github.com/damienbod/AspNet5IdentityServerAngularImplicitFlow/tree/npm-lib-test/src/AngularClient

https://github.com/damienbod/angular-auth-oidc-sample-google-openid

## Notes: 

This npm package was created using the https://github.com/robisim74/angular-library-starter from Roberto Simonetti.

## License
MIT
