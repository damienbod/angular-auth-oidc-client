import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, retry, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { LogoutAuthOptions } from '../auth-options';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { CheckSessionService } from '../iframe/check-session.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { removeNullAndUndefinedValues } from '../utils/object/object.helper';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';

@Injectable({ providedIn: 'root' })
export class LogoffRevocationService {
  constructor(
    private readonly dataService: DataService,
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly loggerService: LoggerService,
    private readonly urlService: UrlService,
    private readonly checkSessionService: CheckSessionService,
    private readonly resetAuthDataService: ResetAuthDataService,
    private readonly redirectService: RedirectService
  ) {}

  // Logs out on the server and the local client.
  // If the server state has changed, check session, then only a local logout.
  logoff(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    logoutAuthOptions?: LogoutAuthOptions
  ): Observable<unknown> {
    this.loggerService.logDebug(
      config,
      'logoff, remove auth',
      logoutAuthOptions
    );

    const { urlHandler, customParams } = logoutAuthOptions || {};

    const endSessionUrl = this.urlService.getEndSessionUrl(
      config,
      customParams
    );

    if (!endSessionUrl) {
      this.loggerService.logDebug(
        config,
        'No endsessionUrl present. Logoff was only locally. Returning.'
      );

      return of(null);
    }

    if (this.checkSessionService.serverStateChanged(config)) {
      this.loggerService.logDebug(
        config,
        'Server State changed. Logoff was only locally. Returning.'
      );

      return of(null);
    }

    if (urlHandler) {
      this.loggerService.logDebug(
        config,
        `Custom UrlHandler found. Using this to handle logoff with url '${endSessionUrl}'`
      );
      urlHandler(endSessionUrl);
      this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

      return of(null);
    }

    return this.logoffInternal(
      logoutAuthOptions,
      endSessionUrl,
      config,
      allConfigs
    );
  }

  logoffLocal(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): void {
    this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
    this.checkSessionService.stop();
  }

  logoffLocalMultiple(allConfigs: OpenIdConfiguration[]): void {
    allConfigs.forEach((configuration) =>
      this.logoffLocal(configuration, allConfigs)
    );
  }

  // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
  // only the access token is revoked. Then the logout run.
  logoffAndRevokeTokens(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    logoutAuthOptions?: LogoutAuthOptions
  ): Observable<any> {
    const { revocationEndpoint } =
      this.storagePersistenceService.read('authWellKnownEndPoints', config) ||
      {};

    if (!revocationEndpoint) {
      this.loggerService.logDebug(config, 'revocation endpoint not supported');

      return this.logoff(config, allConfigs, logoutAuthOptions);
    }

    if (this.storagePersistenceService.getRefreshToken(config)) {
      return this.revokeRefreshToken(config).pipe(
        switchMap((_) => this.revokeAccessToken(config)),
        catchError((error) => {
          const errorMessage = `revoke token failed`;

          this.loggerService.logError(config, errorMessage, error);

          return throwError(() => new Error(errorMessage));
        }),
        concatMap(() => this.logoff(config, allConfigs, logoutAuthOptions))
      );
    } else {
      return this.revokeAccessToken(config).pipe(
        catchError((error) => {
          const errorMessage = `revoke accessToken failed`;

          this.loggerService.logError(config, errorMessage, error);

          return throwError(() => new Error(errorMessage));
        }),
        concatMap(() => this.logoff(config, allConfigs, logoutAuthOptions))
      );
    }
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes an access token on the STS. If no token is provided, then the token from
  // the storage is revoked. You can pass any token to revoke. This makes it possible to
  // manage your own tokens. The is a public API.
  revokeAccessToken(
    configuration: OpenIdConfiguration,
    accessToken?: any
  ): Observable<any> {
    const accessTok =
      accessToken ||
      this.storagePersistenceService.getAccessToken(configuration);
    const body = this.urlService.createRevocationEndpointBodyAccessToken(
      accessTok,
      configuration
    );

    return this.sendRevokeRequest(configuration, body);
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes an refresh token on the STS. This is only required in the code flow with refresh tokens.
  // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
  // This makes it possible to manage your own tokens.
  revokeRefreshToken(
    configuration: OpenIdConfiguration,
    refreshToken?: any
  ): Observable<any> {
    const refreshTok =
      refreshToken ||
      this.storagePersistenceService.getRefreshToken(configuration);
    const body = this.urlService.createRevocationEndpointBodyRefreshToken(
      refreshTok,
      configuration
    );

    return this.sendRevokeRequest(configuration, body);
  }

  private logoffInternal(
    logoutAuthOptions: LogoutAuthOptions | undefined,
    endSessionUrl: string,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<unknown> {
    const { logoffMethod, customParams } = logoutAuthOptions || {};

    if (!logoffMethod || logoffMethod === 'GET') {
      this.redirectService.redirectTo(endSessionUrl);

      this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

      return of(null);
    }

    const { state, logout_hint, ui_locales } = customParams || {};
    const { clientId } = config;
    const idToken = this.storagePersistenceService.getIdToken(config);
    const postLogoutRedirectUrl =
      this.urlService.getPostLogoutRedirectUrl(config);
    const headers = this.getHeaders();
    const { url } = this.urlService.getEndSessionEndpoint(config);
    const body = {
      id_token_hint: idToken,
      client_id: clientId,
      post_logout_redirect_uri: postLogoutRedirectUrl,
      state,
      logout_hint,
      ui_locales,
    };
    const bodyWithoutNullOrUndefined = removeNullAndUndefinedValues(body);

    this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

    return this.dataService.post(
      url,
      bodyWithoutNullOrUndefined,
      config,
      headers
    );
  }

  private sendRevokeRequest(
    configuration: OpenIdConfiguration,
    body: string | null
  ): Observable<any> {
    const url = this.urlService.getRevocationEndpointUrl(configuration);
    const headers = this.getHeaders();

    return this.dataService.post(url, body, configuration, headers).pipe(
      retry(2),
      switchMap((response: any) => {
        this.loggerService.logDebug(
          configuration,
          'revocation endpoint post response: ',
          response
        );

        return of(response);
      }),
      catchError((error) => {
        const errorMessage = `Revocation request failed`;

        this.loggerService.logError(configuration, errorMessage, error);

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private getHeaders(): HttpHeaders {
    let headers: HttpHeaders = new HttpHeaders();

    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    return headers;
  }
}
