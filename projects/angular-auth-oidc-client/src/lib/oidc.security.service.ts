import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { AuthOptions, LogoutAuthOptions } from './auth-options';
import { AuthenticatedResult } from './auth-state/auth-result';
import { AuthStateService } from './auth-state/auth-state.service';
import { CheckAuthService } from './auth-state/check-auth.service';
import { CallbackService } from './callback/callback.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { AuthWellKnownEndpoints } from './config/auth-well-known/auth-well-known-endpoints';
import { AuthWellKnownService } from './config/auth-well-known/auth-well-known.service';
import { ConfigurationService } from './config/config.service';
import { OpenIdConfiguration } from './config/openid-configuration';
import { AuthResult } from './flows/callback-context';
import { FlowsDataService } from './flows/flows-data.service';
import { CheckSessionService } from './iframe/check-session.service';
import { LoginResponse } from './login/login-response';
import { LoginService } from './login/login.service';
import { PopupOptions } from './login/popup/popup-options';
import { LogoffRevocationService } from './logoff-revoke/logoff-revocation.service';
import { UserService } from './user-data/user.service';
import { UserDataResult } from './user-data/userdata-result';
import { TokenHelperService } from './utils/tokenHelper/token-helper.service';
import { UrlService } from './utils/url/url.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class OidcSecurityService {
  private readonly checkSessionService = inject(CheckSessionService);

  private readonly checkAuthService = inject(CheckAuthService);

  private readonly userService = inject(UserService);

  private readonly tokenHelperService = inject(TokenHelperService);

  private readonly configurationService = inject(ConfigurationService);

  private readonly authStateService = inject(AuthStateService);

  private readonly flowsDataService = inject(FlowsDataService);

  private readonly callbackService = inject(CallbackService);

  private readonly logoffRevocationService = inject(LogoffRevocationService);

  private readonly loginService = inject(LoginService);

  private readonly refreshSessionService = inject(RefreshSessionService);

  private readonly urlService = inject(UrlService);

  private readonly authWellKnownService = inject(AuthWellKnownService);

  /**
   * Provides information about the user after they have logged in.
   *
   * @returns Returns an object containing either the user data directly (single config) or
   * the user data per config in case you are running with multiple configs
   */
  get userData$(): Observable<UserDataResult> {
    return this.userService.userData$;
  }

  /**
   * Provides information about the user after they have logged in.
   *
   * @returns Returns an object containing either the user data directly (single config) or
   * the user data per config in case you are running with multiple configs
   */
  userData = toSignal(this.userData$, { requireSync: true });

  /**
   * Emits each time an authorization event occurs.
   *
   * @returns Returns an object containing if you are authenticated or not.
   * Single Config: true if config is authenticated, false if not.
   * Multiple Configs: true is all configs are authenticated, false if only one of them is not
   *
   * The `allConfigsAuthenticated` property contains the auth information _per config_.
   */
  get isAuthenticated$(): Observable<AuthenticatedResult> {
    return this.authStateService.authenticated$;
  }

  /**
   * Emits each time an authorization event occurs.
   *
   * @returns Returns an object containing if you are authenticated or not.
   * Single Config: true if config is authenticated, false if not.
   * Multiple Configs: true is all configs are authenticated, false if only one of them is not
   *
   * The `allConfigsAuthenticated` property contains the auth information _per config_.
   */
  authenticated = toSignal(this.isAuthenticated$, { requireSync: true });

  /**
   * Emits each time the server sends a CheckSession event and the value changed. This property will always return
   * true.
   */
  get checkSessionChanged$(): Observable<boolean> {
    return this.checkSessionService.checkSessionChanged$;
  }

  /**
   * Emits on a Security Token Service callback. The observable will never contain a value.
   */
  get stsCallback$(): Observable<void> {
    return this.callbackService.stsCallback$;
  }

  preloadAuthWellKnownDocument(
    configId?: string
  ): Observable<AuthWellKnownEndpoints> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(
        concatMap((config) =>
          this.authWellKnownService.queryAndStoreAuthWellKnownEndPoints(config)
        )
      );
  }

  /**
   * Returns the currently active OpenID configurations.
   *
   * @returns an array of OpenIdConfigurations.
   */
  getConfigurations(): OpenIdConfiguration[] {
    return this.configurationService.getAllConfigurations();
  }

  /**
   * Returns a single active OpenIdConfiguration.
   *
   * @param configId The configId to identify the config. If not passed, the first one is being returned
   */
  getConfiguration(configId?: string): Observable<OpenIdConfiguration | null> {
    return this.configurationService.getOpenIDConfiguration(configId);
  }

  /**
   * Returns the userData for a configuration
   *
   * @param configId The configId to identify the config. If not passed, the first one is being used
   */
  getUserData(configId?: string): Observable<any> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(map((config) => this.userService.getUserDataFromStore(config)));
  }

  /**
   * Starts the complete setup flow for one configuration. Calling will start the entire authentication flow, and the returned observable
   * will denote whether the user was successfully authenticated including the user data, the access token, the configId and
   * an error message in case an error happened
   *
   * @param url The URL to perform the authorization on the behalf of.
   * @param configId The configId to perform the authorization on the behalf of. If not passed, the first configs will be taken
   *
   * @returns An object `LoginResponse` containing all information about the login
   */
  checkAuth(url?: string, configId?: string): Observable<LoginResponse> {
    return this.configurationService
      .getOpenIDConfigurations(configId)
      .pipe(
        concatMap(({ allConfigs, currentConfig }) =>
          this.checkAuthService.checkAuth(currentConfig, allConfigs, url)
        )
      );
  }

  /**
   * Starts the complete setup flow for multiple configurations.
   * Calling will start the entire authentication flow, and the returned observable
   * will denote whether the user was successfully authenticated including the user data, the access token, the configId and
   * an error message in case an error happened in an array for each config which was provided
   *
   * @param url The URL to perform the authorization on the behalf of.
   *
   * @returns An array of `LoginResponse` objects containing all information about the logins
   */
  checkAuthMultiple(url?: string): Observable<LoginResponse[]> {
    return this.configurationService
      .getOpenIDConfigurations()
      .pipe(
        concatMap(({ allConfigs }) =>
          this.checkAuthService.checkAuthMultiple(allConfigs, url)
        )
      );
  }

  /**
   * Provides information about the current authenticated state
   *
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns A boolean whether the config is authenticated or not.
   */
  isAuthenticated(configId?: string): Observable<boolean> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(map((config) => this.authStateService.isAuthenticated(config)));
  }

  /**
   * Checks the server for an authenticated session using the iframe silent renew if not locally authenticated.
   */
  checkAuthIncludingServer(configId?: string): Observable<LoginResponse> {
    return this.configurationService
      .getOpenIDConfigurations(configId)
      .pipe(
        concatMap(({ allConfigs, currentConfig }) =>
          this.checkAuthService.checkAuthIncludingServer(
            currentConfig,
            allConfigs
          )
        )
      );
  }

  /**
   * Returns the access token for the login scenario.
   *
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns A string with the access token.
   */
  getAccessToken(configId?: string): Observable<string> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(map((config) => this.authStateService.getAccessToken(config)));
  }

  /**
   * Returns the ID token for the sign-in.
   *
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns A string with the id token.
   */
  getIdToken(configId?: string): Observable<string> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(map((config) => this.authStateService.getIdToken(config)));
  }

  /**
   * Returns the refresh token, if present, for the sign-in.
   *
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns A string with the refresh token.
   */
  getRefreshToken(configId?: string): Observable<string> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(map((config) => this.authStateService.getRefreshToken(config)));
  }

  /**
   * Returns the authentication result, if present, for the sign-in.
   *
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns A object with the authentication result
   */
  getAuthenticationResult(configId?: string): Observable<AuthResult | null> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(
        map((config) => this.authStateService.getAuthenticationResult(config))
      );
  }

  /**
   * Returns the payload from the ID token.
   *
   * @param encode Set to true if the payload is base64 encoded
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns The payload from the id token.
   */
  getPayloadFromIdToken(encode = false, configId?: string): Observable<any> {
    return this.configurationService.getOpenIDConfiguration(configId).pipe(
      map((config) => {
        const token = this.authStateService.getIdToken(config);

        return this.tokenHelperService.getPayloadFromToken(
          token,
          encode,
          config
        );
      })
    );
  }

  /**
   * Returns the payload from the access token.
   *
   * @param encode Set to true if the payload is base64 encoded
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns The payload from the access token.
   */
  getPayloadFromAccessToken(
    encode = false,
    configId?: string
  ): Observable<any> {
    return this.configurationService.getOpenIDConfiguration(configId).pipe(
      map((config) => {
        const token = this.authStateService.getAccessToken(config);

        return this.tokenHelperService.getPayloadFromToken(
          token,
          encode,
          config
        );
      })
    );
  }

  /**
   * Sets a custom state for the authorize request.
   *
   * @param state The state to set.
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   */
  setState(state: string, configId?: string): Observable<boolean> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(
        map((config) =>
          this.flowsDataService.setAuthStateControl(state, config)
        )
      );
  }

  /**
   * Gets the state value used for the authorize request.
   *
   * @param configId The configId to check the information for. If not passed, the first configs will be taken
   *
   * @returns The state value used for the authorize request.
   */
  getState(configId?: string): Observable<string> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(map((config) => this.flowsDataService.getAuthStateControl(config)));
  }

  /**
   * Redirects the user to the Security Token Service to begin the authentication process.
   *
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   * @param authOptions The custom options for the the authentication request.
   */
  authorize(configId?: string, authOptions?: AuthOptions): void {
    this.configurationService
      .getOpenIDConfiguration(configId)
      .subscribe((config) => this.loginService.login(config, authOptions));
  }

  /**
   * Opens the Security Token Service in a new window to begin the authentication process.
   *
   * @param authOptions The custom options for the authentication request.
   * @param popupOptions The configuration for the popup window.
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   *
   * @returns An `Observable<LoginResponse>` containing all information about the login
   */
  authorizeWithPopUp(
    authOptions?: AuthOptions,
    popupOptions?: PopupOptions,
    configId?: string
  ): Observable<LoginResponse> {
    return this.configurationService
      .getOpenIDConfigurations(configId)
      .pipe(
        concatMap(({ allConfigs, currentConfig }) =>
          this.loginService.loginWithPopUp(
            currentConfig,
            allConfigs,
            authOptions,
            popupOptions
          )
        )
      );
  }

  /**
   * Manually refreshes the session.
   *
   * @param customParams Custom parameters to pass to the refresh request.
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   *
   * @returns An `Observable<LoginResponse>` containing all information about the login
   */
  forceRefreshSession(
    customParams?: { [key: string]: string | number | boolean },
    configId?: string
  ): Observable<LoginResponse> {
    return this.configurationService
      .getOpenIDConfigurations(configId)
      .pipe(
        concatMap(({ allConfigs, currentConfig }) =>
          this.refreshSessionService.userForceRefreshSession(
            currentConfig,
            allConfigs,
            customParams
          )
        )
      );
  }

  /**
   * Revokes the refresh token (if present) and the access token on the server and then performs the logoff operation.
   * The refresh token and and the access token are revoked on the server. If the refresh token does not exist
   * only the access token is revoked. Then the logout run.
   *
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   * @param logoutAuthOptions The custom options for the request.
   *
   * @returns An observable when the action is finished
   */
  logoffAndRevokeTokens(
    configId?: string,
    logoutAuthOptions?: LogoutAuthOptions
  ): Observable<any> {
    return this.configurationService
      .getOpenIDConfigurations(configId)
      .pipe(
        concatMap(({ allConfigs, currentConfig }) =>
          this.logoffRevocationService.logoffAndRevokeTokens(
            currentConfig,
            allConfigs,
            logoutAuthOptions
          )
        )
      );
  }

  /**
   * Logs out on the server and the local client. If the server state has changed, confirmed via check session,
   * then only a local logout is performed.
   *
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   * @param logoutAuthOptions with custom parameters and/or an custom url handler
   */
  logoff(
    configId?: string,
    logoutAuthOptions?: LogoutAuthOptions
  ): Observable<unknown> {
    return this.configurationService
      .getOpenIDConfigurations(configId)
      .pipe(
        concatMap(({ allConfigs, currentConfig }) =>
          this.logoffRevocationService.logoff(
            currentConfig,
            allConfigs,
            logoutAuthOptions
          )
        )
      );
  }

  /**
   * Logs the user out of the application without logging them out of the server.
   * Use this method if you have _one_ config enabled.
   *
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   */
  logoffLocal(configId?: string): void {
    this.configurationService
      .getOpenIDConfigurations(configId)
      .subscribe(({ allConfigs, currentConfig }) =>
        this.logoffRevocationService.logoffLocal(currentConfig, allConfigs)
      );
  }

  /**
   * Logs the user out of the application for all configs without logging them out of the server.
   * Use this method if you have _multiple_ configs enabled.
   */
  logoffLocalMultiple(): void {
    this.configurationService
      .getOpenIDConfigurations()
      .subscribe(({ allConfigs }) =>
        this.logoffRevocationService.logoffLocalMultiple(allConfigs)
      );
  }

  /**
   * Revokes an access token on the Security Token Service. This is only required in the code flow with refresh tokens. If no token is
   * provided, then the token from the storage is revoked. You can pass any token to revoke.
   * https://tools.ietf.org/html/rfc7009
   *
   * @param accessToken The access token to revoke.
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   *
   * @returns An observable when the action is finished
   */
  revokeAccessToken(accessToken?: any, configId?: string): Observable<any> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(
        concatMap((config) =>
          this.logoffRevocationService.revokeAccessToken(config, accessToken)
        )
      );
  }

  /**
   * Revokes a refresh token on the Security Token Service. This is only required in the code flow with refresh tokens. If no token is
   * provided, then the token from the storage is revoked. You can pass any token to revoke.
   * https://tools.ietf.org/html/rfc7009
   *
   * @param refreshToken The access token to revoke.
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   *
   * @returns An observable when the action is finished
   */
  revokeRefreshToken(refreshToken?: any, configId?: string): Observable<any> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(
        concatMap((config) =>
          this.logoffRevocationService.revokeRefreshToken(config, refreshToken)
        )
      );
  }

  /**
   * Creates the end session URL which can be used to implement an alternate server logout.
   *
   * @param customParams
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   *
   * @returns A string with the end session url or null
   */
  getEndSessionUrl(
    customParams?: { [p: string]: string | number | boolean },
    configId?: string
  ): Observable<string | null> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(
        map((config) => this.urlService.getEndSessionUrl(config, customParams))
      );
  }

  /**
   * Creates the authorize URL based on your flow
   *
   * @param customParams
   * @param configId The configId to perform the action in behalf of. If not passed, the first configs will be taken
   *
   * @returns A string with the authorize URL or null
   */
  getAuthorizeUrl(
    customParams?: { [p: string]: string | number | boolean },
    configId?: string
  ): Observable<string | null> {
    return this.configurationService
      .getOpenIDConfiguration(configId)
      .pipe(
        concatMap((config) =>
          this.urlService.getAuthorizeUrl(
            config,
            customParams ? { customParams } : undefined
          )
        )
      );
  }
}
