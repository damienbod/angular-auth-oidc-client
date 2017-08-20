# angular-auth-oidc-client
[![Build Status](https://travis-ci.org/damienbod/angular-auth-oidc-client.svg?branch=master)](https://travis-ci.org/damienbod/angular-auth-oidc-client) 
>OpenID Connect Implicit Flow

## OpenID Certification

This library is <a href="http://openid.net/certification/#RPs">certified</a> by OpenID Foundation. (RP Implicit and Config RP)
 
<a href="http://openid.net/certification/#RPs"><img src="https://damienbod.files.wordpress.com/2017/06/oid-l-certification-mark-l-rgb-150dpi-90mm.png" alt="" width="200" /></a>


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
 "angular-auth-oidc-client": "1.3.11"
```
 
and type 

``` javascript
 npm install
```

## Using in the angular application

Import the module and services in your module. 

The OidcSecurityService has a dependency on the HttpModule which needs to be imported. This is required, even if you are using the new HttpClientModule module. The angular-auth-oidc-client module supports all versions of Angular 4 onwards.

``` javascript
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { AuthModule, OidcSecurityService, OpenIDImplicitFlowConfiguration } from 'angular-auth-oidc-client';

@NgModule({
    imports: [
        ...
        HttpModule,
        AuthModule.forRoot()
    ],
    declarations: [
        ...
    ],
    providers: [
        OidcSecurityService,
        ...
    ],
    bootstrap:    [AppComponent],
})
```

Set the AuthConfiguration properties to match the server configuration. At present only the id_token token flow is supported.

```typescript

export class AppModule {
    constructor(public oidcSecurityService: OidcSecurityService) {

        let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:44318';
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44311';
        openIDImplicitFlowConfiguration.client_id = 'angularclient';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44311/Unauthorized';
        openIDImplicitFlowConfiguration.startup_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.auto_userinfo = true;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = false;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = false;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
        // openIDImplicitFlowConfiguration.storage = localStorage;
        
        this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);
    }
}


```

Create the login, logout component and use the oidcSecurityService

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { OidcSecurityService } from './auth/services/oidc.security.service';

@Component({
    selector: 'my-app',
    templateUrl: 'app.component.html'
})

export class AppComponent implements OnInit, OnDestroy {

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
        
    }

    ngOnDestroy(): void {
        this.oidcSecurityService.onModuleSetup.unsubscribe();
    }

    login() {
        this.oidcSecurityService.authorize();
    }

    logout() {
        this.oidcSecurityService.logoff();
    }

    private doCallbackLogicIfRequired() {
        if (window.location.hash) {
            this.oidcSecurityService.authorizedCallback();
        }
    }
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

## Custom Storage

If you need, you can create a custom storage (for example to use cookies).

Implement `OidcSecurityStorage` class-interface and the `read` and `write` methods:
```TypeScript
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
```TypeScript
@NgModule({
    imports: [
        ...
        AuthModule.forRoot({ storage: CustomStorage })
    ],
    ...
})
```
See also `oidc.security.storage.ts` for an example.

## Example using: 

https://github.com/damienbod/AspNet5IdentityServerAngularImplicitFlow/tree/npm-lib-test/src/AngularClient

https://github.com/damienbod/angular-auth-oidc-sample-google-openid

https://github.com/HWouters/ad-b2c-oidc-angular

## Notes: 

This npm package was created using the https://github.com/robisim74/angular-library-starter from Roberto Simonetti.

## License
MIT
