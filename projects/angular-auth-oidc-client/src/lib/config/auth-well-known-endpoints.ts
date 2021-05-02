export interface AuthWellKnownEndpoints {
  issuer?: string;
  jwksUri?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  endSessionEndpoint?: string;
  checkSessionIframe?: string;
  revocationEndpoint?: string;
  introspectionEndpoint?: string;
  parEndpoint?: string;
}
