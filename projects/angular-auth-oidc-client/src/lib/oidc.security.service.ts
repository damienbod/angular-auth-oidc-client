import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthOptions } from './auth-options';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { CheckAuthService } from './check-auth.service';
import { ConfigurationProvider } from './config/config.provider';
import { OpenIdConfiguration } from './config/openid-configuration';
import { FlowsDataService } from './flows/flows-data.service';
import { CheckSessionService } from './iframe/check-session.service';
import { LoginResponse } from './login/login-response';
import { LoginService } from './login/login.service';
import { PopupOptions } from './login/popup/popup-options';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { StoragePersistenceService } from './storage/storage-persistence.service';
import { UserService } from './userData/user.service';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';

@Injectable()
export class OidcSecurityService {
  /**
   * Provides information about the user after they have logged in.
   */
  get userData$(): Observable<any> {
    return this.userService.userData$;
  }

  /**
   * Emits each time an authorization event occurs. Returns true if the user is authenticated and false if they are not.
   */
  get isAuthenticated$(): Observable<boolean> {
    return this.authStateService.authorized$;
  }

  /**
   * Emits each time the server sends a CheckSession event and the value changed. This property will always return
   * true.
   */
  get checkSessionChanged$(): Observable<boolean> {
    return this.checkSessionService.checkSessionChanged$;
  }

  /**
   * Emits on possible STS callback. The observable will never contain a value.
   */
  get stsCallback$(): Observable<any> {
    return this.callbackService.stsCallback$;
  }

  constructor(
    private checkSessionService: CheckSessionService,
    private checkAuthService: CheckAuthService,
    private userService: UserService,
    private tokenHelperService: TokenHelperService,
    private configurationProvider: ConfigurationProvider,
    private authStateService: AuthStateService,
    private flowsDataService: FlowsDataService,
    private callbackService: CallbackService,
    private logoffRevocationService: LogoffRevocationService,
    private loginService: LoginService,
    private storagePersistenceService: StoragePersistenceService,
    private refreshSessionService: RefreshSessionService
  ) {}

  /**
   * Returns the currently active OpenID configurations.
   *
   * @returns OpenIdConfiguration if only one is active, an array otherwise
   */
  getConfigurations(): OpenIdConfiguration[] {
    return this.configurationProvider.getAllConfigurations();
  }

  /**
   * Returns a single active OpenIdConfiguration.
   *
   * @param uniqueId The uniqueId to identify the config. If not passed, the first one is being returned
   *
   * @returns OpenIdConfiguration if only one is active, an array otherwise
   */
  getConfiguration(configId?: string): OpenIdConfiguration {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.configurationProvider.getOpenIDConfiguration(configId);
  }

  /**
   * Starts the complete setup flow. Calling will start the entire authentication flow, and the returned observable
   * will denote whether the user was successfully authenticated including the user data and the access token
   *
   * @param url The url to perform the authorization on the behalf of.
   */
  checkAuth(url?: string, configId?: string): Observable<LoginResponse> {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.checkAuthService.checkAuth(configId, url);
  }

  /**
   * Checks the server for an authenticated session using the iframe silent renew if not locally authenticated.
   */
  checkAuthIncludingServer(configId?: string): Observable<LoginResponse> {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.checkAuthService.checkAuthIncludingServer(configId);
  }

  /**
   * Returns the access token for the login scenario.
   */
  getToken(configId?: string): string {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.authStateService.getAccessToken(configId);
  }

  /**
   * Returns the ID token for the login scenario.
   */
  getIdToken(configId?: string): string {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.authStateService.getIdToken(configId);
  }

  /**
   * Returns the refresh token, if present, for the login scenario.
   */
  getRefreshToken(configId?: string): string {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.authStateService.getRefreshToken(configId);
  }

  /**
   * Returns the payload from the ID token.
   *
   * @param encode Set to true if the payload is base64 encoded
   */
  getPayloadFromIdToken(encode = false, configId?: string): any {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    const token = this.getIdToken(configId);
    return this.tokenHelperService.getPayloadFromToken(token, encode, configId);
  }

  /**
   * Sets a custom state for the authorize request.
   *
   * @param state The state to set.
   */
  setState(state: string, configId?: string): void {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    this.flowsDataService.setAuthStateControl(state, configId);
  }

  /**
   * Gets the state value used for the authorize request.
   */
  getState(configId?: string): string {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.flowsDataService.getAuthStateControl(configId);
  }

  /**
   * Redirects the user to the STS to begin the authentication process.
   *
   * @param authOptions The custom options for the the authentication request.
   */
  // Code Flow with PCKE or Implicit Flow
  authorize(authOptions?: AuthOptions, configId?: string): void {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', authOptions.customParams, configId);
    }

    this.loginService.login(configId, authOptions);
  }

  /**
   * Opens the STS in a new window to begin the authentication process.
   *
   * @param authOptions The custom options for the authentication request.
   * @param popupOptions The configuration for the popup window.
   */
  authorizeWithPopUp(authOptions?: AuthOptions, popupOptions?: PopupOptions, configId?: string): Observable<LoginResponse> {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', authOptions.customParams, configId);
    }

    return this.loginService.loginWithPopUp(configId, authOptions, popupOptions);
  }

  /**
   * Manually refreshes the session.
   *
   * @param customParams Custom parameters to pass to the refresh request.
   */
  forceRefreshSession(customParams?: { [key: string]: string | number | boolean }, configId?: string): Observable<LoginResponse> {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    if (customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', customParams, configId);
    }

    return this.refreshSessionService.forceRefreshSession(configId, customParams);
  }

  /**
   * Revokes the refresh token (if present) and the access token on the server and then performs the logoff operation.
   *
   * @param urlHandler An optional url handler for the logoff request.
   */
  // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
  // only the access token is revoked. Then the logout run.
  logoffAndRevokeTokens(urlHandler?: (url: string) => any, configId?: string): Observable<any> {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.logoffRevocationService.logoffAndRevokeTokens(configId, urlHandler);
  }

  /**
   * Logs out on the server and the local client. If the server state has changed, confirmed via check session,
   * then only a local logout is performed.
   *
   * @param authOptions
   */
  logoff(authOptions?: AuthOptions, configId?: string) {
    const { urlHandler, customParams } = authOptions || {};
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.logoffRevocationService.logoff(configId, urlHandler, customParams);
  }

  /**
   * Logs the user out of the application without logging them out of the server.
   */
  logoffLocal(configId?: string): void {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.logoffRevocationService.logoffLocal(configId);
  }

  /**
   * Revokes an access token on the STS. This is only required in the code flow with refresh tokens. If no token is
   * provided, then the token from the storage is revoked. You can pass any token to revoke.
   * https://tools.ietf.org/html/rfc7009
   *
   * @param accessToken The access token to revoke.
   */
  revokeAccessToken(accessToken?: any, configId?: string): Observable<any> {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.logoffRevocationService.revokeAccessToken(configId, accessToken);
  }

  /**
   * Revokes a refresh token on the STS. This is only required in the code flow with refresh tokens. If no token is
   * provided, then the token from the storage is revoked. You can pass any token to revoke.
   * https://tools.ietf.org/html/rfc7009
   *
   * @param refreshToken The access token to revoke.
   */
  revokeRefreshToken(refreshToken?: any, configId?: string): Observable<any> {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.logoffRevocationService.revokeRefreshToken(refreshToken);
  }

  /**
   * Creates the end session URL which can be used to implement an alternate server logout.
   *
   * @param customParams
   */
  getEndSessionUrl(customParams?: { [p: string]: string | number | boolean }, configId?: string): string | null {
    configId = configId ?? this.configurationProvider.getOpenIDConfiguration(configId)?.uniqueId;

    return this.logoffRevocationService.getEndSessionUrl(configId, customParams);
  }
}
