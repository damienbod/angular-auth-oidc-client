import { Injectable } from '@angular/core';

export class DefaultConfiguration {
    stsServer = 'https://localhost:44318';
    redirect_url = 'https://localhost:44311';
    // The Client MUST validate that the aud (audience) Claim contains its client_id value registered at the Issuer identified
    // by the iss (issuer) Claim as an audience.
    // The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience,
    // or if it contains additional audiences not trusted by the Client.
    client_id = 'angularclient';
    response_type = 'id_token token';
    // For some oidc, we require resource identifier to be provided along with the request.
    resource = '';
    scope = 'openid email profile';
    // Only for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param
    hd_param = '';
    post_logout_redirect_uri = 'https://localhost:44311/unauthorized';
    start_checksession = false;
    silent_renew = true;
    silent_renew_offset_in_seconds = 0;
    silent_redirect_url = 'https://localhost:44311';
    post_login_route = '/';
    // HTTP 403
    forbidden_route = '/forbidden';
    // HTTP 401
    unauthorized_route = '/unauthorized';
    auto_userinfo = true;
    auto_clean_state_after_authentication: true;
    trigger_authorization_result_event: false;
    log_console_warning_active = true;
    log_console_debug_active = false;

    // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
    // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
    max_id_token_iat_offset_allowed_in_seconds = 3;

    storage = typeof Storage !== 'undefined' ? sessionStorage : null;
}

export class OpenIDImplicitFlowConfiguration {
    stsServer: string;
    redirect_url: string;
    client_id: string;
    response_type: string;
    resource: string;
    scope: string;
    hd_param: string;
    post_logout_redirect_uri: string;
    start_checksession: boolean;
    silent_renew: boolean;
    silent_renew_offset_in_seconds: number;
    silent_renew_url: string;
    post_login_route: string;
    forbidden_route: string;
    unauthorized_route: string;
    auto_userinfo: boolean;
    auto_clean_state_after_authentication: boolean;
    trigger_authorization_result_event: boolean;
    log_console_warning_active: boolean;
    log_console_debug_active: boolean;
    max_id_token_iat_offset_allowed_in_seconds: number;
    storage: any;
}

@Injectable()
export class AuthConfiguration {
    private openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration;

    get stsServer(): string {
        return (
            this.openIDImplicitFlowConfiguration.stsServer ||
            this.defaultConfig.stsServer
        );
    }

    get redirect_url(): string {
        return (
            this.openIDImplicitFlowConfiguration.redirect_url ||
            this.defaultConfig.redirect_url
        );
    }

    get silent_redirect_url(): string {
        return (
            this.openIDImplicitFlowConfiguration.silent_renew_url ||
            this.defaultConfig.silent_redirect_url
        );
    }

    get client_id(): string {
        return (
            this.openIDImplicitFlowConfiguration.client_id ||
            this.defaultConfig.client_id
        );
    }

    get response_type(): string {
        return (
            this.openIDImplicitFlowConfiguration.response_type ||
            this.defaultConfig.response_type
        );
    }

    get resource(): string {
        return (
            this.openIDImplicitFlowConfiguration.resource ||
            this.defaultConfig.resource
        );
    }

    get scope(): string {
        return (
            this.openIDImplicitFlowConfiguration.scope ||
            this.defaultConfig.scope
        );
    }

    get hd_param(): string {
        return (
            this.openIDImplicitFlowConfiguration.hd_param ||
            this.defaultConfig.hd_param
        );
    }

    get post_logout_redirect_uri(): string {
        return (
            this.openIDImplicitFlowConfiguration.post_logout_redirect_uri ||
            this.defaultConfig.post_logout_redirect_uri
        );
    }

    get start_checksession(): boolean {
        return this.openIDImplicitFlowConfiguration.start_checksession !==
            undefined
            ? this.openIDImplicitFlowConfiguration.start_checksession
            : this.defaultConfig.start_checksession;
    }

    get silent_renew(): boolean {
        return this.openIDImplicitFlowConfiguration.silent_renew !== undefined
            ? this.openIDImplicitFlowConfiguration.silent_renew
            : this.defaultConfig.silent_renew;
    }

    get silent_renew_offset_in_seconds(): number {
        return (
            this.openIDImplicitFlowConfiguration
                .silent_renew_offset_in_seconds ||
            this.defaultConfig.silent_renew_offset_in_seconds
        );
    }

    get post_login_route(): string {
        return (
            this.openIDImplicitFlowConfiguration.post_login_route ||
            this.defaultConfig.post_login_route
        );
    }

    get forbidden_route(): string {
        return (
            this.openIDImplicitFlowConfiguration.forbidden_route ||
            this.defaultConfig.forbidden_route
        );
    }

    get unauthorized_route(): string {
        return (
            this.openIDImplicitFlowConfiguration.unauthorized_route ||
            this.defaultConfig.unauthorized_route
        );
    }

    get auto_userinfo(): boolean {
        return this.openIDImplicitFlowConfiguration.auto_userinfo !== undefined
            ? this.openIDImplicitFlowConfiguration.auto_userinfo
            : this.defaultConfig.auto_userinfo;
    }

    get auto_clean_state_after_authentication(): boolean {
        return this.openIDImplicitFlowConfiguration
            .auto_clean_state_after_authentication !== undefined
            ? this.openIDImplicitFlowConfiguration
                  .auto_clean_state_after_authentication
            : this.defaultConfig.auto_clean_state_after_authentication;
    }

    get trigger_authorization_result_event(): boolean {
        return this.openIDImplicitFlowConfiguration
            .trigger_authorization_result_event !== undefined
            ? this.openIDImplicitFlowConfiguration
                  .trigger_authorization_result_event
            : this.defaultConfig.trigger_authorization_result_event;
    }

    get log_console_warning_active(): boolean {
        return this.openIDImplicitFlowConfiguration
            .log_console_warning_active !== undefined
            ? this.openIDImplicitFlowConfiguration.log_console_warning_active
            : this.defaultConfig.log_console_warning_active;
    }

    get log_console_debug_active(): boolean {
        return this.openIDImplicitFlowConfiguration.log_console_debug_active !==
            undefined
            ? this.openIDImplicitFlowConfiguration.log_console_debug_active
            : this.defaultConfig.log_console_debug_active;
    }

    get max_id_token_iat_offset_allowed_in_seconds(): number {
        return (
            this.openIDImplicitFlowConfiguration
                .max_id_token_iat_offset_allowed_in_seconds ||
            this.defaultConfig.max_id_token_iat_offset_allowed_in_seconds
        );
    }

    get storage(): any {
        return (
            this.openIDImplicitFlowConfiguration.storage ||
            this.defaultConfig.storage
        );
    }

    constructor(private defaultConfig: DefaultConfiguration) {}

    init(openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration) {
        this.openIDImplicitFlowConfiguration = openIDImplicitFlowConfiguration;
    }
}
