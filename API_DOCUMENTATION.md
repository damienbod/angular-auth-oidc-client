# angular-auth-oidc-client API documentation

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

URL used to get the configuration is reading locally.


## OidcSecurityService

### @Output() onUserDataLoaded: EventEmitter<any>

### checkSessionChanged: boolean;
	
### isAuthorized: boolean;

### getToken()

### getUserData()
	
### authorize() 

### authorizedCallback() 

### logoff()

### handleError(error: any)


