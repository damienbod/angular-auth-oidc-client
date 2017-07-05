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

### startup_route

default value : '/dataeventrecords/list'

The Angular route which is used after a successful login.

### forbidden_route

default value : '/Forbidden'

Route, if the server returns a 403. This is an Angular route. HTTP 403

### unauthorized_route

default value : '/Unauthorized'

Route, if the server returns a 401. This is an Angular route. HTTP 401

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
   

## OidcSecurityService

### @Output() onUserDataLoaded: EventEmitter<any>

This event can be used when the User data is loaded.

### checkSessionChanged: boolean;
	
This boolean is set to throurg when the OpenID session management recieves a message that the server session has changed.

### isAuthorized: boolean;

Set to true if the client and user are authenicated.

### getToken()

public function to get the access_token which can be used to access APIs on the server.

### getUserData()
	
Gets the user data from the auth module of the logged in user.

### authorize() 

Starts the OpenID Implicit Flow authenication and authorization.

### authorizedCallback() 

Redirect after a STS server login. This method validates the id_token and the access_token if used. 

### logoff()

Logs off from the client application and also from the server if the endsession API is implemented on the STS server.

###

## setStorage(storage: any)

In the app module of the Angular app you can set the storage of your choice. Tested with localStorage and sessionStorage
This needs to be called before the setupModule function.

```typescript
 constructor(public oidcSecurityService: OidcSecurityService) {
        ...

        // this.oidcSecurityService.setStorage(localStorage);
        this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);
    }
```

### handleError(error: any)

handle errors from the auth module.