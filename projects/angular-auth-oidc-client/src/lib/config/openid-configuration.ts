import { LogLevel } from '../logging/log-level';

export interface OpenIdConfiguration {
    stsServer?: string;
    authWellknownEndpoint?: string;
    redirectUrl?: string;
    clientId?: string;
    responseType?: string;
    scope?: string;
    hdParam?: string;
    postLogoutRedirectUri?: string;
    startCheckSession?: boolean;
    silentRenew?: boolean;
    silentRenewUrl?: string;
    renewTimeBeforeTokenExpiresInSeconds?: number;
    useRefreshToken?: boolean;
    ignoreNonceAfterRefresh?: boolean;
    postLoginRoute?: string;
    forbiddenRoute?: string;
    unauthorizedRoute?: string;
    autoUserinfo?: boolean;
    renewUserInfoAfterTokenRenew?: boolean;
    autoCleanStateAfterAuthentication?: boolean;
    triggerAuthorizationResultEvent?: boolean;
    logLevel?: LogLevel;
    issValidationOff?: boolean;
    historyCleanupOff?: boolean;
    maxIdTokenIatOffsetAllowedInSeconds?: number;
    disableIatOffsetValidation?: boolean;
    storage?: any;
    customParams?: { [key: string]: string | number | boolean };
    eagerLoadAuthWellKnownEndpoints?: boolean;

    // Azure B2C have implemented this incorrectly. Add support for to disable this until fixed.
    disableRefreshIdTokenAuthTimeValidation?: boolean;
    tokenRefreshInSeconds?: number;
}
