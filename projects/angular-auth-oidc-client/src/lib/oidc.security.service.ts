import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthOptions } from './auth-options';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { CheckAuthService } from './check-auth.service';
import { ConfigurationProvider } from './config/config.provider';
import { PublicConfiguration } from './config/public-configuration';
import { FlowsDataService } from './flows/flows-data.service';
import { CheckSessionService } from './iframe/check-session.service';
import { LoginService } from './login/login.service';
import { PopupOptions } from './login/popup/popup-options';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { StoragePersistenceService } from './storage/storage-persistence.service';
import { UserService } from './userData/user-service';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';
import { LoginResponse } from './login/login-response';
import { TokenResponse } from './tokens/token-response';

@Injectable()
export class OidcSecurityService {
  /**
   * Gets the currently active OpenID configuration.
   */
  get configuration(): PublicConfiguration {
    const openIDConfiguration = this.configurationProvider.getOpenIDConfiguration();

    return {
      configuration: openIDConfiguration,
      wellknown: this.storagePersistenceService.read('authWellKnownEndPoints'),
    };
  }

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
   * Starts the complete setup flow. Calling will start the entire authentication flow, and the returned observable
   * will denote whether the user was successfully authenticated.
   *
   * @param url The url to perform the authorization on the behalf of.
   */
  checkAuth(url?: string): Observable<boolean> {
    return this.checkAuthService.checkAuth(url);
  }

  /**
   * Checks the server for an authenticated session using the iframe silent renew if not locally authenticated.
   */
  checkAuthIncludingServer(): Observable<boolean> {
    return this.checkAuthService.checkAuthIncludingServer();
  }

  /**
   * Returns the access token for the login scenario.
   */
  getToken(): string {
    return this.authStateService.getAccessToken();
  }

  /**
   * Returns the ID token for the login scenario.
   */
  getIdToken(): string {
    return this.authStateService.getIdToken();
  }

  /**
   * Returns the refresh token, if present, for the login scenario.
   */
  getRefreshToken(): string {
    return this.authStateService.getRefreshToken();
  }

  /**
   * Returns the payload from the ID token.
   *
   * @param encode Set to true if the payload is base64 encoded
   */
  getPayloadFromIdToken(encode = false): any {
    const token = this.getIdToken();
    return this.tokenHelperService.getPayloadFromToken(token, encode);
  }

  /**
   * Sets a custom state for the authorize request.
   *
   * @param state The state to set.
   */
  setState(state: string): void {
    this.flowsDataService.setAuthStateControl(state);
  }

  /**
   * Gets the state value used for the authorize request.
   */
  getState(): string {
    return this.flowsDataService.getAuthStateControl();
  }

  /**
   * Redirects the user to the STS to begin the authentication process.
   *
   * @param authOptions The custom options for the the authentication request.
   */
  // Code Flow with PCKE or Implicit Flow
  authorize(authOptions?: AuthOptions): void {
    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', authOptions.customParams);
    }

    this.loginService.login(authOptions);
  }

  /**
   * Opens the STS in a new window to begin the authentication process.
   *
   * @param authOptions The custom options for the authentication request.
   * @param popupOptions The configuration for the popup window.
   */
  authorizeWithPopUp(authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse> {
    if (authOptions?.customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', authOptions.customParams);
    }

    return this.loginService.loginWithPopUp(authOptions, popupOptions);
  }

  /**
   * Manually refreshes the session.
   *
   * @param customParams Custom parameters to pass to the refresh request.
   */
  forceRefreshSession(customParams?: { [key: string]: string | number | boolean }): Observable<TokenResponse> {
    if (customParams) {
      this.storagePersistenceService.write('storageCustomRequestParams', customParams);
    }

    return this.refreshSessionService.forceRefreshSession(customParams);
  }

  /**
   * Revokes the refresh token (if present) and the access token on the server and then performs the logoff operation.
   *
   * @param urlHandler An optional url handler for the logoff request.
   */
  // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
  // only the access token is revoked. Then the logout run.
  logoffAndRevokeTokens(urlHandler?: (url: string) => any): Observable<any> {
    return this.logoffRevocationService.logoffAndRevokeTokens(urlHandler);
  }

  /**
   * Logs out on the server and the local client. If the server state has changed, confirmed via checksession,
   * then only a local logout is performed.
   *
   * @param urlHandler
   */
  logoff(urlHandler?: (url: string) => any): void {
    return this.logoffRevocationService.logoff(urlHandler);
  }

  /**
   * Logs the user out of the application without logging them out of the server.
   */
  logoffLocal(): void {
    return this.logoffRevocationService.logoffLocal();
  }

  /**
   * Revokes an access token on the STS. This is only required in the code flow with refresh tokens. If no token is
   * provided, then the token from the storage is revoked. You can pass any token to revoke.
   * https://tools.ietf.org/html/rfc7009
   *
   * @param accessToken The access token to revoke.
   */
  revokeAccessToken(accessToken?: any): Observable<any> {
    return this.logoffRevocationService.revokeAccessToken(accessToken);
  }

  /**
   * Revokes a refresh token on the STS. This is only required in the code flow with refresh tokens. If no token is
   * provided, then the token from the storage is revoked. You can pass any token to revoke.
   * https://tools.ietf.org/html/rfc7009
   *
   * @param refreshToken The access token to revoke.
   */
  revokeRefreshToken(refreshToken?: any): Observable<any> {
    return this.logoffRevocationService.revokeRefreshToken(refreshToken);
  }

  /**
   * Creates the end session URL which can be used to implement an alternate server logout.
   */
  getEndSessionUrl(): string | null {
    return this.logoffRevocationService.getEndSessionUrl();
  }
}
