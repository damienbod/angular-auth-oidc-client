import { Injectable } from '@angular/core';

export class DefaultConfiguration {
    stsServer = 'https://localhost:44318';
    redirect_url = 'https://localhost:44311';
    // The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience.
    // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.
    client_id = 'angularclient';
    response_type = 'id_token token';
    // For some oidc, we require resource identifier to be provided along with the request.
    resource = '';
    scope = 'openid email profile';
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

export class CustomConfiguration {

    constructor(
        public stsServer: string,
        public redirect_url: string,
        public client_id: string,
        public response_type: string,
        public resource: string,
        public scope: string,
        public post_logout_redirect_uri: string,
        public start_checksession: boolean,
        public silent_renew = true,
        public startup_route: string,
        public forbidden_route: string,
        public unauthorized_route: string,
        public log_console_warning_active: boolean,
        public log_console_debug_active: boolean,
        public max_id_token_iat_offset_allowed_in_seconds: number,
        public override_well_known_configuration: boolean,
        public override_well_known_configuration_url: string
    ) { }
}

@Injectable()
export class AuthConfiguration {
    private _customConfiguration: CustomConfiguration;

    get stsServer(): string {
        return this._customConfiguration.stsServer || this.defaultConfig.stsServer;
    }

    get redirect_url(): string {
        return this._customConfiguration.redirect_url || this.defaultConfig.redirect_url;
    }

    get client_id(): string {
        return this._customConfiguration.client_id || this.defaultConfig.client_id;
    }

    get response_type(): string {
        return this._customConfiguration.response_type || this.defaultConfig.response_type;
    }

    get resource(): string {
        return this._customConfiguration.resource || this.defaultConfig.resource;
    }

    get scope(): string {
        return this._customConfiguration.scope || this.defaultConfig.scope;
    }

    get post_logout_redirect_uri(): string {
        return this._customConfiguration.post_logout_redirect_uri || this.defaultConfig.post_logout_redirect_uri;
    }

    get start_checksession(): boolean {
        return this._customConfiguration.start_checksession || this.defaultConfig.start_checksession;
    }

    get silent_renew(): boolean {
        return this._customConfiguration.silent_renew || this.defaultConfig.silent_renew;
    }

    get startup_route(): string {
        return this._customConfiguration.startup_route || this.defaultConfig.startup_route;
    }

    get forbidden_route(): string {
        return this._customConfiguration.forbidden_route || this.defaultConfig.forbidden_route;
    }

    get unauthorized_route(): string {
        return this._customConfiguration.unauthorized_route || this.defaultConfig.unauthorized_route;
    }

    get log_console_warning_active(): boolean {
        return this._customConfiguration.log_console_warning_active || this.defaultConfig.log_console_warning_active;
    }

    get log_console_debug_active(): boolean {
        return this._customConfiguration.log_console_debug_active || this.defaultConfig.log_console_debug_active;
    }

    get max_id_token_iat_offset_allowed_in_seconds(): number {
        return this._customConfiguration.max_id_token_iat_offset_allowed_in_seconds || this.defaultConfig.max_id_token_iat_offset_allowed_in_seconds;
    }

    get override_well_known_configuration(): boolean {
        return this._customConfiguration.override_well_known_configuration || this.defaultConfig.override_well_known_configuration;
    }

    get override_well_known_configuration_url(): string {
        return this._customConfiguration.override_well_known_configuration_url || this.defaultConfig.override_well_known_configuration_url;
    }

    constructor(private defaultConfig: DefaultConfiguration) { }

    init(customConfiguration: CustomConfiguration) {
        this._customConfiguration = customConfiguration;
    }
}