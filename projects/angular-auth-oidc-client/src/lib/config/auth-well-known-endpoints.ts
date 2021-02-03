export interface AuthWellKnownEndpoints {
  issuer?: string;
  jwksUri?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  endSessionEndpoint?: string;
  checkSessionIframe?: string;
  revocationEndpoint?: string;
  introspectionEndpoint?: string;
}
