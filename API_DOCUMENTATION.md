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

'id_token token' or i'd_token' Name of the flow which can be configured. You must use the 'id_token token' flow, if you want to access an API or get user data from the server. The access_token is required for this, and only returned with tis flow.

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

### post_login_route

default value : '/'

The default Angular route which is used after a successful login, if not using the <em>trigger_authorization_result_event</em>

### forbidden_route

default value : '/Forbidden'

Route, if the server returns a 403. This is an Angular route. HTTP 403

### unauthorized_route

default value : '/Unauthorized'

Route, if the server returns a 401. This is an Angular route. HTTP 401

### auto_userinfo

default value : 'true'

Automatically get user info after authentication.

### log_console_warning_active

default value : true

Logs all warnings from the module to the console. This can be viewed using F12 in Chrome of Firefox.

### log_console_debug_active

default value : false

Logs all debug messages from the module to the console. This can be viewed using F12 in Chrome of Firefox.

### max_id_token_iat_offset_allowed_in_seconds

default value : 3

id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
	
### override_well_known_configuration

default value : false

If you want to configure the well known endpoints locally, you need to set this to true.

### override_well_known_configuration_url
	
default value : 'https://localhost:44386/wellknownconfiguration.json'

URL used to get the configuration if it is being read locally.

### resource

default value : ''

For some oidc, we require resource identifier to be provided along with the request.

### storage

default value : sessionStorage

You can set the storage to localStorage, or implement a custom storage (see README).
   
### auto_clean_state_after_authentication

can be used for custom state logic handling, the state is not automatically reset, when set to false

### trigger_authorization_result_event

This can be set to true which emits an event instead of an angular route change.

Instead of forcing the application consuming this library to automatically redirect to one of the 3 hard-configured routes (start, unauthorized, forbidden), this modification will add an extra configuration option to override such behavior and trigger an event that will allow to subscribe to it and let the application perform other actions.
This would be useful to allow the application to save an initial return url so that the user is redirected to it after a successful login on the STS (ie: saving the return url previously on sessionStorage and then retrieving it during the triggering of the event).

default value : false;

### silent_renew_offset_in_seconds

Makes it possible to add an offset to the silent renew check in seconds. By entering a negivative value, you can renew the tokens, before the tokens expire.

default value : 0;

### hd_param

Optional hd parameter for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param

## OidcSecurityService

### @Output() moduleSetup: boolean

Can be used to check if the setup logic is already completed, before your component loads.

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

### @Output() onModuleSetup: EventEmitter<any> = new EventEmitter<any>(true);

Example using:


App.module: get your json settings:

```typescript
configClient() {
	return this.http.get(`${window.location.origin}/api/ClientAppSettings`);
}
```

App.module: 
Config the module, subscribe to the json get:

```typescript
this.configClient().subscribe((config: any) => {
	// this.clientConfiguration = config;

	let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
	openIDImplicitFlowConfiguration.stsServer = this.clientConfiguration.stsServer;
	openIDImplicitFlowConfiguration.redirect_url = this.clientConfiguration.redirect_url;
	// The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience.
	// The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.
	openIDImplicitFlowConfiguration.client_id = this.clientConfiguration.client_id;
	openIDImplicitFlowConfiguration.response_type = this.clientConfiguration.response_type;
	openIDImplicitFlowConfiguration.scope = this.clientConfiguration.scope;
	openIDImplicitFlowConfiguration.post_logout_redirect_uri = this.clientConfiguration.post_logout_redirect_uri;
	openIDImplicitFlowConfiguration.start_checksession = this.clientConfiguration.start_checksession;
	openIDImplicitFlowConfiguration.silent_renew = this.clientConfiguration.silent_renew;
	openIDImplicitFlowConfiguration.post_login_route = this.clientConfiguration.startup_route;
	// HTTP 403
	openIDImplicitFlowConfiguration.forbidden_route = this.clientConfiguration.forbidden_route;
	// HTTP 401
	openIDImplicitFlowConfiguration.unauthorized_route = this.clientConfiguration.unauthorized_route;
	openIDImplicitFlowConfiguration.log_console_warning_active = this.clientConfiguration.log_console_warning_active;
	openIDImplicitFlowConfiguration.log_console_debug_active = this.clientConfiguration.log_console_debug_active;
	// id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
	// limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
	openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = this.clientConfiguration.max_id_token_iat_offset_allowed_in_seconds;

	configuration.FileServer = this.clientConfiguration.apiFileServer;
	configuration.Server = this.clientConfiguration.apiServer;

	this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);
});
}
```

AppComponent, subscribe to the onModuleSetup event:

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
            this.oidcSecurityService.authorizedCallback();
        }
    }
```

This is required if you need to wait for a json configuration file to load.

### @Output() onAuthorizationResult: EventEmitter<AuthorizationResult>
 
This event returns the result of the authorization callback. It is only used if the trigger_authorization_result_event configuration property is set to true.

### checkSessionChanged: boolean;
	
This boolean is set to true when the OpenID session management receives a message that the server session has changed.

### getIsAuthorized(): Observable<boolean>

Set to true if the client and user are authenticated.

Example using:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { OidcSecurityService } from 'angular-auth-oidc-client';


@Component({
    selector: 'example',
    templateUrl: 'example.component.html'
})

export class ExampleComponent implements OnInit, OnDestroy   {

    isAuthorizedSubscription: Subscription;
    isAuthorized: boolean;

    constructor(
        public oidcSecurityService: OidcSecurityService,
    ) {
    }

    ngOnInit() {
        this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(
            (isAuthorized: boolean) => {
                this.isAuthorized = isAuthorized;
            });
    }

    ngOnDestroy() {
        this.isAuthorizedSubscription.unsubscribe();
    }

}
```

### getIdToken()

public function to get the id_token

### getToken()

public function to get the access_token which can be used to access APIs on the server.

### getUserData(): Observable<any> 

Example using:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { OidcSecurityService } from 'angular-auth-oidc-client';


@Component({
    selector: 'example',
    templateUrl: 'example.component.html'
})

export class ExampleComponent implements OnInit, OnDestroy   {

    userDataSubscription: Subscription;
    userData: boolean;

    constructor(
        public oidcSecurityService: OidcSecurityService,
    ) {
    }

    ngOnInit() {
        this.userDataSubscription = this.oidcSecurityService.getUserData().subscribe(
            (userData: any) => {
                 this.userData = userData
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

Starts the OpenID Implicit Flow authenication and authorization.

### authorizedCallback() 

Redirect after a STS server login. This method validates the id_token and the access_token if used. 

### logoff()

Logs off from the client application and also from the server if the endsession API is implemented on the STS server.

### handleError(error: any)

handle errors from the auth module.