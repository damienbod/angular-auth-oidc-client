import { Injectable } from '@angular/core';

@Injectable()
export class AuthConfiguration {

    stsServer = 'https://localhost:44318';

    redirect_url = 'https://localhost:44311';

    // The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience.
    // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.
    client_id = 'angularclient';

    response_type = 'id_token token';

    scope = 'dataEventRecords securedFiles openid';

    post_logout_redirect_uri = 'https://localhost:44311/Unauthorized';

    start_checksession = false;

    silent_renew = true;

    startup_route = '/dataeventrecords/list';

    // HTTP 403
    forbidden_route = '/Forbidden';

    // HTTP 401
    unauthorized_route = '/Unauthorized';

    log_console_warning_active = true;

    log_console_debug_active = false;

    // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
    // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
    max_id_token_iat_offset_allowed_in_seconds = 3;

    override_well_known_configuration = false;

    override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
}