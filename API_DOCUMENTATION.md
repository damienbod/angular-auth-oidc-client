# angular-auth-oidc-client API documentation

## AuthConfiguration 

### stsServer

default value : 'https://localhost:44318';

### redirect_url

default value : 'https://localhost:44311'

### client_id

default value : 'angularclient'

The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience. The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.

### response_type

default value : 'id_token token'

### scope

default value : 'openid email profile'

### post_logout_redirect_uri

default value : 'https://localhost:44311/Unauthorized'

### start_checksession

default value : false

### silent_renew

default value : true

### startup_route

default value : '/dataeventrecords/list'

### forbidden_route

default value : '/Forbidden'

HTTP 403

### unauthorized_route

default value : '/Unauthorized'

HTTP 401

### log_console_warning_active

default value : true

### log_console_debug_active

default value : false

### max_id_token_iat_offset_allowed_in_seconds

default value : 3

id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
	
### override_well_known_configuration

default value : false

### override_well_known_configuration_url
	
default value : 'https://localhost:44386/wellknownconfiguration.json'

## OidcSecurityService

