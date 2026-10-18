import { LogLevel } from '../logging/types/logging.types';
import { OpenIdConfiguration } from './openid-configuration';

export const DEFAULT_SILENT_RENEW_TIMEOUT_IN_SECONDS = 20;

export const getSilentRenewTimeoutInMilliseconds = ({
  silentRenewTimeoutInSeconds,
}: OpenIdConfiguration): number =>
  (silentRenewTimeoutInSeconds ?? DEFAULT_SILENT_RENEW_TIMEOUT_IN_SECONDS) *
  1000;

export const DEFAULT_CONFIG: OpenIdConfiguration = {
  authority: 'https://please_set',
  authWellknownEndpointUrl: '',
  authWellknownEndpoints: undefined,
  redirectUrl: 'https://please_set',
  checkRedirectUrlWhenCheckingIfIsCallback: true,
  clientId: 'please_set',
  responseType: 'code',
  scope: 'openid email profile',
  hdParam: '',
  postLogoutRedirectUri: 'https://please_set',
  startCheckSession: false,
  silentRenew: false,
  silentRenewUrl: 'https://please_set',
  silentRenewTimeoutInSeconds: DEFAULT_SILENT_RENEW_TIMEOUT_IN_SECONDS,
  renewTimeBeforeTokenExpiresInSeconds: 0,
  useRefreshToken: false,
  useRefreshTokenLock: false,
  disableRefreshTokenOfflineAccessScopeWarning: false,
  usePushedAuthorisationRequests: false,
  ignoreNonceAfterRefresh: false,
  postLoginRoute: '/',
  forbiddenRoute: '/forbidden',
  unauthorizedRoute: '/unauthorized',
  autoUserInfo: true,
  autoCleanStateAfterAuthentication: true,
  triggerAuthorizationResultEvent: false,
  logLevel: LogLevel.Warn,
  issValidationOff: false,
  strictIssuerValidationOnWellKnownRetrievalOff: false,
  historyCleanupOff: false,
  maxIdTokenIatOffsetAllowedInSeconds: 120,
  disableIatOffsetValidation: false,
  customParamsAuthRequest: {},
  customParamsRefreshTokenRequest: {},
  customParamsEndSessionRequest: {},
  customParamsCodeRequest: {},
  disableRefreshIdTokenAuthTimeValidation: false,
  triggerRefreshWhenIdTokenExpired: true,
  tokenRefreshInSeconds: 4,
  refreshTokenRetryInSeconds: 3,
  ngswBypass: false,
};
