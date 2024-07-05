import { LogLevel } from '../logging/log-level';
import { AuthWellKnownEndpoints } from './auth-well-known/auth-well-known-endpoints';

export interface OpenIdConfiguration {
  /**
   * To identify a configuration the `configId` parameter was introduced.
   * If you do not explicitly set this value, the library will generate
   * and assign the value for you. If set, the configured value is used.
   * The value is optional.
   */
  configId?: string;
  /**
   * The url to the Security Token Service (STS). The authority issues tokens.
   * This field is required.
   */
  authority?: string;
  /** Override the default Security Token Service wellknown endpoint postfix. */
  authWellknownEndpointUrl?: string;
  authWellknownEndpoints?: AuthWellKnownEndpoints;

  /**
   * Override the default Security Token Service wellknown endpoint postfix.
   *
   * @default /.well-known/openid-configuration
   */
  authWellknownUrlSuffix?: string;

  /** The redirect URL defined on the Security Token Service. */
  redirectUrl?: string;
  /**
   * Whether to check if current URL matches the redirect URI when determining
   * if current URL is in fact the redirect URI.
   * Default: true
   */
  checkRedirectUrlWhenCheckingIfIsCallback?: boolean;
  /**
   * The Client MUST validate that the aud (audience) Claim contains its `client_id` value
   * registered at the Issuer identified by the iss (issuer) Claim as an audience.
   * The ID Token MUST be rejected if the ID Token does not list the Client as a valid audience,
   * or if it contains additional audiences not trusted by the Client.
   */
  clientId?: string;
  /**
   * `code`, `id_token token` or `id_token`.
   * Name of the flow which can be configured.
   * You must use the `id_token token` flow, if you want to access an API
   * or get user data from the server. The `access_token` is required for this,
   * and only returned with this flow.
   */
  responseType?: string;
  /**
   * List of scopes which are requested from the server from this client.
   * This must match the Security Token Service configuration for the client you use.
   * The `openid` scope is required. The `offline_access` scope can be requested when using refresh tokens
   * but this is optional and some Security Token Service do not support this or recommend not requesting this even when using
   * refresh tokens in the browser.
   */
  scope?: string;
  /**
   * Optional hd parameter for Google Auth with particular G Suite domain,
   * see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param
   */
  hdParam?: string;
  /** URL to redirect to after a server logout if using the end session API. */
  postLogoutRedirectUri?: string;
  /**	Starts the OpenID session management for this client. */
  startCheckSession?: boolean;
  /** Renews the client tokens, once the id_token expires. Can use iframes or refresh tokens. */
  silentRenew?: boolean;
  /** An optional URL to handle silent renew callbacks */
  silentRenewUrl?: string;
  /**
   * Sets the maximum waiting time for silent renew process. If this time is exceeded, the silent renew state will
   * be reset. Default = 20.
   * */
  silentRenewTimeoutInSeconds?: number;
  /**
   * Makes it possible to add an offset to the silent renew check in seconds.
   * By entering a value, you can renew the tokens before the tokens expire.
   */
  renewTimeBeforeTokenExpiresInSeconds?: number;
  /**
   * Allows for a custom domain to be used with Auth0.
   * With this flag set the 'authority' does not have to end with
   * 'auth0.com' to trigger the auth0 special handling of logouts.
   */
  useCustomAuth0Domain?: boolean;
  /**
   * When set to true, refresh tokens are used to renew the user session.
   * When set to false, standard silent renew is used.
   * Default value is false.
   */
  useRefreshToken?: boolean;
  /**
   * Activates Pushed Authorisation Requests for login and popup login.
   * Not compatible with iframe renew.
   */
  usePushedAuthorisationRequests?: boolean;
  /**
   * A token obtained by using a refresh token normally doesn't contain a nonce value.
   * The library checks it is not there. However, some OIDC endpoint implementations do send one.
   * Setting `ignoreNonceAfterRefresh` to `true` disables the check if a nonce is present.
   * Please note that the nonce value, if present, will not be verified. Default is `false`.
   */
  ignoreNonceAfterRefresh?: boolean;
  /**
   * The default Angular route which is used after a successful login, if not using the
   * `triggerAuthorizationResultEvent`
   */
  postLoginRoute?: string;
  /** Route to redirect to if the server returns a 403 error. This has to be an Angular route. HTTP 403. */
  forbiddenRoute?: string;
  /** Route to redirect to if the server returns a 401 error. This has to be an Angular route. HTTP 401. */
  unauthorizedRoute?: string;
  /** When set to true, the library automatically gets user info after authentication */
  autoUserInfo?: boolean;
  /** When set to true, the library automatically gets user info after token renew */
  renewUserInfoAfterTokenRenew?: boolean;
  /** Used for custom state logic handling. The state is not automatically reset when set to false */
  autoCleanStateAfterAuthentication?: boolean;
  /**
   * This can be set to true which emits an event instead of an Angular route change.
   * Instead of forcing the application consuming this library to automatically redirect to one of the 3
   * hard-configured routes (start, unauthorized, forbidden), this modification will add an extra
   * configuration option to override such behavior and trigger an event that will allow to subscribe to
   * it and let the application perform other actions. This would be useful to allow the application to
   * save an initial return URL so that the user is redirected to it after a successful login on the Security Token Service
   * (i.e. saving the return URL previously on sessionStorage and then retrieving it during the triggering of the event).
   */
  triggerAuthorizationResultEvent?: boolean;
  /** 0, 1, 2 can be used to set the log level displayed in the console. */
  logLevel?: LogLevel;
  /** Make it possible to turn off the iss validation per configuration. **You should not turn this off!** */
  issValidationOff?: boolean;
  /**
   * If this is active, the history is not cleaned up on an authorize callback.
   * This can be used when the application needs to preserve the history.
   */
  historyCleanupOff?: boolean;
  /**
   * Amount of offset allowed between the server creating the token and the client app receiving the id_token.
   * The diff in time between the server time and client time is also important in validating this value.
   * All times are in UTC.
   */
  maxIdTokenIatOffsetAllowedInSeconds?: number;
  /**
   * This allows the application to disable the iat offset validation check.
   * The iat Claim can be used to reject tokens that were issued too far away from the current time,
   * limiting the amount of time that nonces need to be stored to prevent attacks.
   * The acceptable range is client specific.
   */
  disableIatOffsetValidation?: boolean;

  /** Extra parameters to add to the authorization URL request */
  customParamsAuthRequest?: { [key: string]: string | number | boolean };

  /** Extra parameters to add to the refresh token request body */
  customParamsRefreshTokenRequest?: {
    [key: string]: string | number | boolean;
  };

  /** Extra parameters to add to the authorization EndSession request */
  customParamsEndSessionRequest?: { [key: string]: string | number | boolean };

  /** Extra parameters to add to the token URL request */
  customParamsCodeRequest?: { [key: string]: string | number | boolean };

  // Azure B2C have implemented this incorrectly. Add support for to disable this until fixed.
  /** Disables the auth_time validation for id_tokens in a refresh due to Azure's incorrect implementation. */
  disableRefreshIdTokenAuthTimeValidation?: boolean;

  /**
   * Enables the id_token validation, default value is `true`.
   * You can disable this validation if you like to ignore the expired value in the renew process or not check this in the expiry check. Only the access token is used to trigger a renew.
   * If no id_token is returned in using refresh tokens, set this to `false`.
   */
  triggerRefreshWhenIdTokenExpired?: boolean;

  /** Controls the periodic check time interval in sections.
   * Default value is 3.
   */
  tokenRefreshInSeconds?: number;
  /**
   * Array of secure URLs on which the token should be sent if the interceptor is added to the `HTTP_INTERCEPTORS`.
   */
  secureRoutes?: string[];
  /**
   * Controls the periodic retry time interval for retrieving new tokens in seconds.
   * `silentRenewTimeoutInSeconds` and `tokenRefreshInSeconds` are upper bounds for this value.
   * Default value is 3
   */
  refreshTokenRetryInSeconds?: number;
  /** Adds the ngsw-bypass param to all requests */
  ngswBypass?: boolean;
  /** Allow refresh token reuse (refresh without rotation), default value is false.
   * The refresh token rotation is optional (rfc6749) but is more safe and hence encouraged.
   */
  allowUnsafeReuseRefreshToken?: boolean;
  /** Disable validation for id_token
   *  This is not recommended! You should always validate the id_token if returned.
   */
  disableIdTokenValidation?: boolean;
  /** Disables PKCE support.
   * Authorize request will be sent without code challenge.
   */
  disablePkce?: boolean;
}
