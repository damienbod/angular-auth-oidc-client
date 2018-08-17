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
  scope = 'openid email profile';
  // Only for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param
  hd_param = '';
  post_logout_redirect_uri = 'https://localhost:44311/unauthorized';
  start_checksession = false;
  silent_renew = true;
  silent_renew_url = 'https://localhost:44311';
  silent_renew_offset_in_seconds = 0;
  silent_redirect_url = 'https://localhost:44311';
  post_login_route = '/';
  // HTTP 403
  forbidden_route = '/forbidden';
  // HTTP 401
  unauthorized_route = '/unauthorized';
  auto_userinfo = true;
  auto_clean_state_after_authentication = true;
  trigger_authorization_result_event = false;
  log_console_warning_active = true;
  log_console_debug_active = false;

  // id_token C8: The iat Claim can be used to reject tokens that were issued too far away from the current time,
  // limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is Client specific.
  max_id_token_iat_offset_allowed_in_seconds = 3;

  storage = typeof Storage !== 'undefined' ? sessionStorage : null;
}

export class OpenIDImplicitFlowConfiguration {
  stsServer = 'https://localhost:44318';
  redirect_url = 'https://localhost:44311';
  client_id = 'angularclient';
  response_type = 'id_token token';
  resource = '';
  scope = 'openid email profile';
  hd_param = '';
  post_logout_redirect_uri = 'https://localhost:44311/unauthorized';
  start_checksession = false;
  silent_renew = true;
  silent_renew_url = 'https://localhost:44311';
  silent_renew_offset_in_seconds = 0;
  silent_redirect_url = 'https://localhost:44311';
  post_login_route = '/';
  forbidden_route = '/forbidden';
  unauthorized_route = '/unauthorized';
  auto_userinfo = true;
  auto_clean_state_after_authentication = true;
  trigger_authorization_result_event = false;
  log_console_warning_active = true;
  log_console_debug_active = false;
  max_id_token_iat_offset_allowed_in_seconds = 3;
  storage: any = typeof window !== 'undefined' ? sessionStorage : null;
}

@Injectable()
export class AuthConfiguration {
  private openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration | undefined;

  get stsServer(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.stsServer;
    }

    return this.defaultConfig.stsServer;
  }

  get redirect_url(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.redirect_url;
    }

    return this.defaultConfig.redirect_url;
  }

  get silent_redirect_url(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.silent_renew_url;
    }

    return this.defaultConfig.silent_renew_url;
  }

  get client_id(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.client_id;
    }

    return this.defaultConfig.client_id;
  }

  get response_type(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.response_type;
    }

    return this.defaultConfig.response_type;
  }

  get scope(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.scope;
    }

    return this.defaultConfig.scope;
  }

  get hd_param(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.hd_param;
    }

    return this.defaultConfig.hd_param;
  }

  get post_logout_redirect_uri(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.post_logout_redirect_uri;
    }

    return this.defaultConfig.post_logout_redirect_uri;
  }

  get start_checksession(): boolean {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.start_checksession;
    }

    return this.defaultConfig.start_checksession;
  }

  get silent_renew(): boolean {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.silent_renew;
    }

    return this.defaultConfig.silent_renew;
  }

  get silent_renew_offset_in_seconds(): number {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds;
    }

    return this.defaultConfig.silent_renew_offset_in_seconds;
  }

  get post_login_route(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.post_login_route;
    }

    return this.defaultConfig.post_login_route;
  }

  get forbidden_route(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.forbidden_route;
    }

    return this.defaultConfig.forbidden_route;
  }

  get unauthorized_route(): string {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.unauthorized_route;
    }

    return this.defaultConfig.unauthorized_route;
  }

  get auto_userinfo(): boolean {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.auto_userinfo;
    }

    return this.defaultConfig.auto_userinfo;
  }

  get auto_clean_state_after_authentication(): boolean {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.auto_clean_state_after_authentication;
    }

    return this.defaultConfig.auto_clean_state_after_authentication;
  }

  get trigger_authorization_result_event(): boolean {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.trigger_authorization_result_event;
    }

    return this.defaultConfig.trigger_authorization_result_event;
  }

  get isLogLevelWarningEnabled(): boolean {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.log_console_warning_active;
    }

    return this.defaultConfig.log_console_warning_active;
  }

  get isLogLevelDebugEnabled(): boolean {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.log_console_debug_active;
    }

    return this.defaultConfig.log_console_debug_active;
  }

  get max_id_token_iat_offset_allowed_in_seconds(): number {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds;
    }

    return this.defaultConfig.max_id_token_iat_offset_allowed_in_seconds;
  }

  get storage(): any {
    if (this.openIDImplicitFlowConfiguration) {
      return this.openIDImplicitFlowConfiguration.storage;
    }

    return this.defaultConfig.storage;
  }

  constructor(private defaultConfig: DefaultConfiguration) {}

  init(openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration) {
    this.openIDImplicitFlowConfiguration = openIDImplicitFlowConfiguration;
  }
}
