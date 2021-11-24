import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, retry, switchMap, tap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { AuthOptions } from '../auth-options';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { CheckSessionService } from '../iframe/check-session.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';

@Injectable()
export class LogoffRevocationService {
  constructor(
    private dataService: DataService,
    private storagePersistenceService: StoragePersistenceService,
    private loggerService: LoggerService,
    private urlService: UrlService,
    private checkSessionService: CheckSessionService,
    private resetAuthDataService: ResetAuthDataService,
    private redirectService: RedirectService
  ) {}

  // Logs out on the server and the local client.
  // If the server state has changed, check session, then only a local logout.
  logoff(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], authOptions?: AuthOptions): void {
    const { urlHandler, customParams } = authOptions || {};

    this.loggerService.logDebug(config, 'logoff, remove auth ');

    const endSessionUrl = this.getEndSessionUrl(config, customParams);

    this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

    if (!endSessionUrl) {
      this.loggerService.logDebug(config, 'only local login cleaned up, no end_session_endpoint');

      return;
    }

    if (this.checkSessionService.serverStateChanged(config)) {
      this.loggerService.logDebug(config, 'only local login cleaned up, server session has changed');
    } else if (urlHandler) {
      urlHandler(endSessionUrl);
    } else {
      this.redirectService.redirectTo(endSessionUrl);
    }
  }

  logoffLocal(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
    this.checkSessionService.stop();
  }

  logoffLocalMultiple(allConfigs: OpenIdConfiguration[]): void {
    allConfigs.forEach((configuration) => this.logoffLocal(configuration, allConfigs));
  }

  // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
  // only the access token is revoked. Then the logout run.
  logoffAndRevokeTokens(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], authOptions?: AuthOptions): Observable<any> {
    const { revocationEndpoint } = this.storagePersistenceService.read('authWellKnownEndPoints', config) || {};

    if (!revocationEndpoint) {
      this.loggerService.logDebug(config, 'revocation endpoint not supported');
      this.logoff(config, allConfigs, authOptions);
    }

    if (this.storagePersistenceService.getRefreshToken(config)) {
      return this.revokeRefreshToken(config).pipe(
        switchMap((result) => this.revokeAccessToken(config, result)),
        catchError((error) => {
          const errorMessage = `revoke token failed`;
          this.loggerService.logError(config, errorMessage, error);

          return throwError(() => new Error(errorMessage));
        }),
        tap(() => this.logoff(config, allConfigs, authOptions))
      );
    } else {
      return this.revokeAccessToken(config).pipe(
        catchError((error) => {
          const errorMessage = `revoke accessToken failed`;
          this.loggerService.logError(config, errorMessage, error);

          return throwError(() => new Error(errorMessage));
        }),
        tap(() => this.logoff(config, allConfigs, authOptions))
      );
    }
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes an access token on the STS. If no token is provided, then the token from
  // the storage is revoked. You can pass any token to revoke. This makes it possible to
  // manage your own tokens. The is a public API.
  revokeAccessToken(configuration: OpenIdConfiguration, accessToken?: any): Observable<any> {
    const accessTok = accessToken || this.storagePersistenceService.getAccessToken(configuration);
    const body = this.urlService.createRevocationEndpointBodyAccessToken(accessTok, configuration);

    return this.sendRevokeRequest(configuration, body);
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes an refresh token on the STS. This is only required in the code flow with refresh tokens.
  // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
  // This makes it possible to manage your own tokens.
  revokeRefreshToken(configuration: OpenIdConfiguration, refreshToken?: any): Observable<any> {
    const refreshTok = refreshToken || this.storagePersistenceService.getRefreshToken(configuration);
    const body = this.urlService.createRevocationEndpointBodyRefreshToken(refreshTok, configuration);

    return this.sendRevokeRequest(configuration, body);
  }

  getEndSessionUrl(configuration: OpenIdConfiguration, customParams?: { [p: string]: string | number | boolean }): string | null {
    const idToken = this.storagePersistenceService.getIdToken(configuration);
    const { customParamsEndSessionRequest } = configuration;

    const mergedParams = { ...customParamsEndSessionRequest, ...customParams };

    return this.urlService.createEndSessionUrl(idToken, configuration, mergedParams);
  }

  private sendRevokeRequest(configuration: OpenIdConfiguration, body: string): Observable<any> {
    const url = this.urlService.getRevocationEndpointUrl(configuration);

    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    return this.dataService.post(url, body, configuration, headers).pipe(
      retry(2),
      switchMap((response: any) => {
        this.loggerService.logDebug(configuration, 'revocation endpoint post response: ', response);

        return of(response);
      }),
      catchError((error) => {
        const errorMessage = `Revocation request failed`;
        this.loggerService.logError(configuration, errorMessage, error);

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
