export interface Schema {
    stsUrl: string;
    flowType: FlowType;
}

export enum FlowType {
    OidcCodeFlowPkceAzureAdUsingRefreshTokens = 'OIDC Code Flow PKCE Azure AD using refresh tokens',
    OidcCodeFlowPkceAzureAdUsingIframeSilentRenew = 'OIDC Code Flow PKCE Azure AD using iframe silent renew',
    OidcCodeFlowPkceUsingRefreshTokens = 'OIDC Code Flow PKCE using refresh tokens',
    OidcCodeFlowPkceUsingIframeSilentRenew = 'OIDC Code Flow PKCE using iframe silent renew',
    OidcCodeFlowPkceUsingIframeSilentRenewGettingConfigFromHttp = 'OIDC Code Flow PKCE using iframe silent renew getting config from http',
}
