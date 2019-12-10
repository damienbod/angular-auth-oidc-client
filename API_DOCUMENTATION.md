# angular-auth-oidc-client API documentation

Documentation : [Quickstart](https://github.com/damienbod/angular-auth-oidc-client) | [API Documentation](https://github.com/damienbod/angular-auth-oidc-client/blob/master/API_DOCUMENTATION.md) | [Changelog](https://github.com/damienbod/angular-auth-oidc-client/blob/master/CHANGELOG.md)

## AuthConfiguration

### stsServer

default value : 'https://localhost:44318';

This is the URL where the security token service (STS) server is located.

### redirect_url

default value : 'https://localhost:44311'

This is the redirect_url which was configured on the security token service (STS) server.

### client_id

default value : 'angularclient'

The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience. The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.

### response_type

default value : 'id_token token'

'id_token token' or 'id_token' Name of the flow which can be configured. You must use the 'id_token token' flow, if you want to access an API or get user data from the server. The access_token is required for this, and only returned with this flow.

### scope

default value : 'openid email profile'

This is this scopes which are requested from the server from this client. This must match the STS server configuration.

### post_logout_redirect_uri

default value : 'https://localhost:44311/Unauthorized'

Url after a server logout if using the end session API.

### start_checksession

default value : false

Starts the OpenID session management for this client.

### silent_renew

default value : true

Renews the client tokens, once the token_id expires.

### silent_renew_url

default value : https://localhost:44311

URL which can be used for a lightweight renew callback.

Example of a silent-renew.html callback html file.

Note: The CustomEvent does not work for older versions of IE. Add a javascript function instead of this, if required.

### Code Flow with PKCE

```html
<!DOCTYPE html>
<html>
    <head>
        <base href="./" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>silent-renew</title>
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    </head>
    <body>
        <script>
            window.onload = function() {
                /* The parent window hosts the Angular application */
                var parent = window.parent;
                /* Send the id_token information to the oidc message handler */
                var event = new CustomEvent('oidc-silent-renew-message', { detail: window.location });
                parent.dispatchEvent(event);
            };
        </script>
    </body>
</html>
```

### Implicit Flow

```html
<!DOCTYPE html>
<html>
    <head>
        <base href="./" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>silent_renew</title>
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    </head>
    <body>
        <script>
            window.onload = function() {
                /* The parent window hosts the Angular application */
                var parent = window.parent;
                /* Send the id_token information to the oidc message handler */
                var event = new CustomEvent('oidc-silent-renew-message', { detail: window.location.hash.substr(1) });
                parent.dispatchEvent(event);
            };
        </script>
    </body>
</html>
```

### post_login_route

default value : '/'

The default Angular route which is used after a successful login, if not using the <em>trigger_authorization_result_event</em>

### forbidden_route

default value : '/Forbidden'

Route, if the server returns a 403. This is an Angular route. HTTP 403

### unauthorized_route

default value : '/Unauthorized'

Route, if the server returns a 401. This is an Angular route. HTTP 401

### iss_validation_off

Make it possible to turn the iss validation off per configuration. You should not turn this off!

default value : 'false'

### auto_userinfo

default value : 'true'

Automatically get user info after authentication.

### log_console_warning_active

default value : true

Logs all warnings from the module to the console. This can be viewed using F12 in Chrome or Firefox.

### log_console_debug_active

default value : false

Logs all debug messages from the module to the console. This can be viewed using F12 in Chrome or Firefox.

### history_cleanup_off

default value : false

If this is active, the history is not cleaned up at an authorize callback. This can be used, when the application needs to preserve the history.

### max_id_token_iat_offset_allowed_in_seconds

default value : 3

### isauthorizedrace_timeout_in_seconds

default value : 5

### disable_iat_offset_validation

default value : false

This allows the application to disable the iat offset validation check.

id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is client specific.

### storage

default value : sessionStorage

You can set the storage to `localStorage`, or implement a custom storage (see README).

### auto_clean_state_after_authentication

can be used for custom state logic handling, the state is not automatically reset, when set to false.

### trigger_authorization_result_event

default value : false

This can be set to `true` which emits an event instead of an angular route change.

Instead of forcing the application consuming this library to automatically redirect to one of the 3 hard-configured routes (start, unauthorized, forbidden), this modification will add an extra configuration option to override such behavior and trigger an event that will allow to subscribe to it and let the application perform other actions.
This would be useful to allow the application to save an initial return url so that the user is redirected to it after a successful login on the STS (ie: saving the return url previously on sessionStorage and then retrieving it during the triggering of the event).

### silent_renew_offset_in_seconds

default value : 0

Makes it possible to add an offset to the silent renew check in seconds. By entering a value, you can renew the tokens, before the tokens expire.

### hd_param

Optional hd parameter for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param

## OidcSecurityService

### moduleSetup: boolean

Can be used to check if the setup logic is already completed, before your component loads.

_Note: See also: [getIsModuleSetup()](#getismodulesetup-observable)_

```typescript
constructor(public oidcSecurityService: OidcSecurityService) {
	if (this.oidcSecurityService.moduleSetup) {
		this.doCallbackLogicIfRequired();
	} else {
		this.oidcSecurityService.onModuleSetup.subscribe(() => {
			this.doCallbackLogicIfRequired();
		});
	}
}
```

### onModuleSetup: Observable<any>();

_Note: This will only emit once and late subscribers will never be notified. If you want a more reliable notification see: [getIsModuleSetup()](#getismodulesetup-observable)_

Example using:

`app.module`: get your json settings:

```typescript
export function loadConfig(oidcConfigService: OidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return () => oidcConfigService.load(`${window.location.origin}/api/ClientAppSettings`);
}
```

```typescript
providers: [
	OidcConfigService,
	OidcSecurityService,
	{
		provide: APP_INITIALIZER,
		useFactory: loadConfig,
		deps: [OidcConfigService],
		multi: true
	},
	OidcSecurityService,
	...
],
```

`app.module`:
Config the module, subscribe to the json get:

```typescript
export class AppModule {
    constructor(private oidcSecurityService: OidcSecurityService, private oidcConfigService: OidcConfigService) {
        this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) => {

            const config: OpenIdConfiguration = {
                stsServer = configResult.stsServer;
                redirect_url = configResult.redirect_url;
                // The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer
                // identified by the iss (issuer) Claim as an audience.
                // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience,
                // or if it contains additional audiences not trusted by the Client.
                client_id = configResult.client_id;
                response_type = configResult.response_type;
                scope = configResult.scope;
                post_logout_redirect_uri = configResult.post_logout_redirect_uri;
                start_checksession = configResult.start_checksession;
                silent_renew = configResult.silent_renew;
                post_login_route = configResult.startup_route;
                // HTTP 403
                forbidden_route = configResult.forbidden_route;
                // HTTP 401
                unauthorized_route = configResult.unauthorized_route;
                log_console_warning_active = configResult.log_console_warning_active;
                log_console_debug_active = configResult.log_console_debug_active;
                // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
                // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
                max_id_token_iat_offset_allowed_in_seconds = configResult.max_id_token_iat_offset_allowed_in_seconds;
            };

            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
        });

        console.log('APP STARTING');
    }
}
```

`AppComponent`, subscribe to the onModuleSetup event:

```typescript
constructor(public oidcSecurityService: OidcSecurityService) {
	if (this.oidcSecurityService.moduleSetup) {
		this.doCallbackLogicIfRequired();
	} else {
		this.oidcSecurityService.onModuleSetup.subscribe(() => {
			this.doCallbackLogicIfRequired();
		});
	}
}
```

Handle the authorize callback using the event:

```typescript
 private onModuleSetup() {
        if (window.location.hash) {
            this.oidcSecurityService.authorizedImplicitFlowCallback();
        }
    }
```

This is required if you need to wait for a json configuration file to load.

### onCheckSessionChanged = new Observable<boolean>();

This event is triggered when the check session changed event is received from the server.

```typescript
this.subscription = this.oidcSecurityService.onCheckSessionChanged.subscribe(
(checksession: boolean) => {
	console.log('...recieved a check session event');
	this.checksession = checksession;
	if (window.parent) {
		// sent from the child iframe
		window.parent.location.href = '/check_session_logic';
	}
});

ngOnDestroy(): void {
    if(this.subscription) {
        this.subscription.unsubscribe();
    }
}
```

### checkSessionChanged: boolean;

This boolean is set to true when the OpenID session management receives a message that the server session has changed.

### getIsAuthorized(): Observable<boolean>

This method will return an observable that will not emit until after module setup is completed. The emitted value will be set to `true` if the client and user are authenticated, `false` otherwise. If silent renew is configured, a silent renew will be attempted before emitting `false`.

Example using:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'example',
    templateUrl: 'example.component.html',
})
export class ExampleComponent implements OnInit, OnDestroy {
    isAuthorizedSubscription: Subscription;
    isAuthorized: boolean;

    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe((isAuthorized: boolean) => {
            this.isAuthorized = isAuthorized;
        });
    }

    ngOnDestroy() {
        this.isAuthorizedSubscription.unsubscribe();
    }
}
```

### getIsModuleSetup(): Observable<boolean>

This method will return an observable that will emit right away with a value set to `true` if the module has completed setup, `false` otherwise. It will continue to emit its last value to all late subscribers.

Example using:

```typescript
this.oidcSecurityService
    .getIsModuleSetup()
    .pipe(
        filter((isModuleSetup: boolean) => isModuleSetup),
        take(1)
    )
    .subscribe((isModuleSetup: boolean) => {
        // Do something when module setup is completed.
    });
```

### getIdToken()

public function to get the `id_token`

### getToken()

public function to get the `access_token` which can be used to access APIs on the server.

### getUserData(): Observable<any>

Example using:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'example',
    templateUrl: 'example.component.html',
})
export class ExampleComponent implements OnInit, OnDestroy {
    userDataSubscription: Subscription;
    userData: { name: string };

    constructor(public oidcSecurityService: OidcSecurityService) {}

    ngOnInit() {
        this.userDataSubscription = this.oidcSecurityService.getUserData<{ name: string }>().subscribe(userData => {
            this.userData = userData;
        });
    }

    ngOnDestroy() {
        this.userDataSubscription.unsubscribe();
    }
}
```

Gets the user data from the auth module of the logged in user.

### getUserinfo

Gets the user data direct from the STS API

### setCustomRequestParameters(params: { [key: string]: string | number | boolean })

public function so extra parameters can be added to the authorization URL request.

### authorize()

Starts the OpenID Implicit Flow authentication and authorization.

### authorizedCallbackWithCode()

Redirect after a STS server login for the code flow. This method validates the id_token and the access_token if used.

### authorizedImplicitFlowCallback()

Redirect after a STS server login for the implicit flow. This method validates the id_token and the access_token if used.

### logoff()

Logs off from the client application and also from the server if the endsession API is implemented on the STS server.

### handleError(error: any)

handle errors from the auth module.

### onAuthorizationResult: Observable<AuthorizationResult>

This event returns the result of the authorization callback.

Import the classes:

```typescript
import { AuthorizationResult } from './auth/models/authorization-result';
import { AuthorizationState } from './auth/models/authorization-state.enum';

// Use this if you need to work with the validation result.
//import { ValidationResult } from './auth/models/validation-result.enum';
```

Subscribe to the event:

```typescript
//...
    this.onAuthorizationResultSubscription = this.oidcSecurityService.onAuthorizationResult.pipe(
        tap((authorizationResult: AuthorizationResult) => {
            console.log('Auth result received AuthorizationState:'
                + authorizationResult.authorizationState
                + ' validationResult:' + authorizationResult.validationResult);
        }),
        map((authorizationResult: AuthorizationResult) => authorizationResult.authorizationState),
        filter((authorizationState: AuthorizationState) => authorizationState === AuthorizationState.unauthorized)
    ).subscribe(() => {
        this.router.navigate(['/unauthorized']);
    });
//...

private onAuthorizationResultSubscription: Subscription;

ngOnDestroy(): void {
    if(this.onAuthorizationResultSubscription) {
        this.onAuthorizationResultSubscription.unsubscribe();
    }
}
```

### use_refresh_token

boolean property set to false. Standard silent renew mode used per default. Refresh tokens can be activated.
