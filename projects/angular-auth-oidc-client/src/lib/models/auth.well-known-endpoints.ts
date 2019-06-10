export interface AuthWellKnownEndpoints {
  issuer?: string;
  jwks_uri?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
  check_session_iframe?: string;
  revocation_endpoint?: string;
  introspection_endpoint?: string;
}
