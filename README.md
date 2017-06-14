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

Get the [Changelog](https://github.com/damienbod/angular-auth-oidc-client/blob/master/CHANGELOG.md).

Latest docs : https://github.com/damienbod/angular-auth-oidc-client

## <a></a>Using the package

Add the npm package to your package.json
```typescript
 "angular-auth-oidc-client": "0.0.7"
```

## jsrsasign

The npm depends on jsrsasign. You need to download this, the full lib, and add it to your main html file.

https://github.com/kjur/jsrsasign

https://cdnjs.com/libraries/jsrsasign

```html
<!doctype html>
<html>
<head>
    <base href="./">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ASP.NET Core 1.0 Angular IdentityServer4 Client</title>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
	
	<script src="assets/jsrsasign.min.js"></script>
</head>
<body>
    <my-app>Loading...</my-app>
</body>
</html>
```

## Using in the angular application

Import the module and services in your module. Set the AuthConfiguration properties to match the server configuration. At present only the id_token token flow is supported.

```typescript
import { NgModule } from '@angular/core';

...

import { AuthModule, AuthConfiguration, OidcSecurityService } from 'angular-auth-oidc-client';

@NgModule({
    imports: [
        ...
        AuthModule.forRoot(),
    ],
    declarations: [
        AppComponent,
		...
    ],
    providers: [
        OidcSecurityService,
        ...
    ],
    bootstrap:    [AppComponent],
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


## Example using: 

https://github.com/damienbod/AspNet5IdentityServerAngularImplicitFlow/tree/npm-lib-test/src/AngularClient

## Notes: 

This npm package was created using the https://github.com/robisim74/angular-library-starter from Roberto Simonetti.

## License
MIT
