export interface Schema {
  stsUrlOrTenantId: string;
  flowType: FlowType;
}

export enum FlowType {
  OidcCodeFlowPkceAzureAdUsingRefreshTokens = 'OIDC Code Flow PKCE Azure AD using refresh tokens',
  OidcCodeFlowPkceAzureAdUsingIframeSilentRenew = 'OIDC Code Flow PKCE Azure AD using iframe silent renew',
  OidcCodeFlowPkceUsingRefreshTokens = 'OIDC Code Flow PKCE using refresh tokens',
  OAuthPushauthorizationrequestsusingrefreshtokens = 'OAuth Push authorization requests using refresh tokens',
  OidcCodeFlowPkceUsingIframeSilentRenew = 'OIDC Code Flow PKCE using iframe silent renew',
  OidcCodeFlowPkceUsingIframeSilentRenewGettingConfigFromHttp = 'OIDC Code Flow PKCE using iframe silent renew getting config from http',
  OIDCCodeFlowPkce = 'OIDC Code Flow PKCE (no renew)',
  Auth0 = 'Auth0',
  DefaultConfig = 'Default config',
}
