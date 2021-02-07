const DEFAULT_CONFIG = `{
              stsServer: '<stsUrlOrTenantId>',
              redirectUrl: window.location.origin,
              postLogoutRedirectUri: window.location.origin,
              clientId: 'please-enter-clientId',
              scope: 'please-enter-scopes', // 'openid profile offline_access ' + your scopes
              responseType: 'code',
              silentRenew: true,
              useRefreshToken: true,
              renewTimeBeforeTokenExpiresInSeconds: 30,
          }`;

const IFRAME_SILENT_RENEW = `{
            stsServer: '<stsUrlOrTenantId>',
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: 'please-enter-clientId',
            scope: 'please-enter-scopes', // 'openid profile ' + your scopes
            responseType: 'code',
            silentRenew: true,
            silentRenewUrl: window.location.origin + '/silent-renew.html',
            renewTimeBeforeTokenExpiresInSeconds: 10,
        }`;

const AZURE_AD_SILENT_RENEW = `{
            stsServer: 'https://login.microsoftonline.com/<stsUrlOrTenantId>/v2.0',
            authWellknownEndpoint: 'https://login.microsoftonline.com/common/v2.0',
            redirectUrl: window.location.origin,
            clientId: 'please-enter-clientId',
            scope: 'please-enter-scopes', // 'openid profile ' + your scopes
            responseType: 'code',
            silentRenew: true,
            maxIdTokenIatOffsetAllowedInSeconds: 600,
            issValidationOff: false,
            autoUserinfo: false,
            silentRenewUrl: window.location.origin + '/silent-renew.html',
        }`;

const AZURE_AD_REFRESH_TOKENS = `{
            stsServer: 'https://login.microsoftonline.com/<stsUrlOrTenantId>/v2.0',
            authWellknownEndpoint: 'https://login.microsoftonline.com/common/v2.0',
            redirectUrl: window.location.origin,
            clientId: 'please-enter-clientId',
            scope: 'please-enter-scopes', // 'openid profile offline_access ' + your scopes
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
            maxIdTokenIatOffsetAllowedInSeconds: 600,
            issValidationOff: false,
            autoUserinfo: false,
    }`;

const AUTH_0 = `{
            stsServer: '<stsUrlOrTenantId>',
            redirectUrl: window.location.origin,
            clientId: 'please-enter-auth0-clientId',
            scope: 'openid profile offline_access',
            responseType: 'code',
            silentRenew: true,
            useRefreshToken: true,
        }`;

const OIDC_PLAIN = `{
            stsServer: '<stsUrlOrTenantId>',
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: 'please-enter-clientId',
            scope: 'please-enter-scopes', // 'openid profile ' + your scopes
            responseType: 'code',
            silentRenew: false,
            renewTimeBeforeTokenExpiresInSeconds: 10,
        }`;

export { DEFAULT_CONFIG, AZURE_AD_SILENT_RENEW, IFRAME_SILENT_RENEW, AZURE_AD_REFRESH_TOKENS, OIDC_PLAIN, AUTH_0 };
