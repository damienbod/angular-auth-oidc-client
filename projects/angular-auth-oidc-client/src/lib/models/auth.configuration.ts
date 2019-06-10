export interface OpenIdConfiguration {
  stsServer?: string;
  redirect_url?: string;
  client_id?: string;
  response_type?: string;
  scope?: string;
  hd_param?: string;
  post_logout_redirect_uri?: string;
  start_checksession?: boolean;
  silent_renew?: boolean;
  silent_renew_url?: string;
  silent_renew_offset_in_seconds?: number;
  post_login_route?: string;
  forbidden_route?: string;
  unauthorized_route?: string;
  auto_userinfo?: boolean;
  auto_clean_state_after_authentication?: boolean;
  trigger_authorization_result_event?: boolean;
  log_console_warning_active?: boolean;
  log_console_debug_active?: boolean;
  iss_validation_off?: boolean;
  history_cleanup_off?: boolean;
  max_id_token_iat_offset_allowed_in_seconds?: number;
  disable_iat_offset_validation?: boolean;
  storage?: any;
}

export interface OpenIdInternalConfiguration {
  stsServer: string;
  redirect_url: string;
  client_id: string;
  response_type: string;
  scope: string;
  hd_param: string;
  post_logout_redirect_uri: string;
  start_checksession: boolean;
  silent_renew: boolean;
  silent_renew_url: string;
  silent_renew_offset_in_seconds: number;
  post_login_route: string;
  forbidden_route: string;
  unauthorized_route: string;
  auto_userinfo: boolean;
  auto_clean_state_after_authentication: boolean;
  trigger_authorization_result_event: boolean;
  log_console_warning_active: boolean;
  log_console_debug_active: boolean;
  iss_validation_off: boolean;
  history_cleanup_off: boolean;
  max_id_token_iat_offset_allowed_in_seconds: number;
  disable_iat_offset_validation: boolean;
  storage: any;
}
