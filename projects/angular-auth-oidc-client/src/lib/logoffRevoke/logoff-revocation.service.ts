import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError, retry, switchMap, tap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { CheckSessionService } from '../iframe/check-session.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';

@Injectable()
export class LogoffRevocationService {
  constructor(
    private dataService: DataService,
    private storagePersistanceService: StoragePersistanceService,
    private loggerService: LoggerService,
    private urlService: UrlService,
    private checkSessionService: CheckSessionService,
    private resetAuthDataService: ResetAuthDataService,
    private redirectService: RedirectService
  ) {}

  // Logs out on the server and the local client.
  // If the server state has changed, checksession, then only a local logout.
  logoff(urlHandler?: (url: string) => any) {
    this.loggerService.logDebug('logoff, remove auth ');
    const endSessionUrl = this.getEndSessionUrl();
    this.resetAuthDataService.resetAuthorizationData();

    if (!endSessionUrl) {
      this.loggerService.logDebug('only local login cleaned up, no end_session_endpoint');
      return;
    }

    if (this.checkSessionService.serverStateChanged()) {
      this.loggerService.logDebug('only local login cleaned up, server session has changed');
    } else if (urlHandler) {
      urlHandler(endSessionUrl);
    } else {
      this.redirectService.redirectTo(endSessionUrl);
    }
  }

  logoffLocal() {
    this.resetAuthDataService.resetAuthorizationData();
    this.checkSessionService.stop();
  }

  // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
  // only the access token is revoked. Then the logout run.
  logoffAndRevokeTokens(urlHandler?: (url: string) => any) {
    if (!this.storagePersistanceService.read('authWellKnownEndPoints')?.revocationEndpoint) {
      this.loggerService.logDebug('revocation endpoint not supported');
      this.logoff(urlHandler);
    }

    if (this.storagePersistanceService.getRefreshToken()) {
      return this.revokeRefreshToken().pipe(
        switchMap((result) => this.revokeAccessToken(result)),
        catchError((error) => {
          const errorMessage = `revoke token failed`;
          this.loggerService.logError(errorMessage, error);
          return throwError(errorMessage);
        }),
        tap(() => this.logoff(urlHandler))
      );
    } else {
      return this.revokeAccessToken().pipe(
        catchError((error) => {
          const errorMessage = `revoke access token failed`;
          this.loggerService.logError(errorMessage, error);
          return throwError(errorMessage);
        }),
        tap(() => this.logoff(urlHandler))
      );
    }
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes an access token on the STS. If no token is provided, then the token from
  // the storage is revoked. You can pass any token to revoke. This makes it possible to
  // manage your own tokens. The is a public API.
  revokeAccessToken(accessToken?: any) {
    const accessTok = accessToken || this.storagePersistanceService.getAccessToken();
    const body = this.urlService.createRevocationEndpointBodyAccessToken(accessTok);
    const url = this.urlService.getRevocationEndpointUrl();

    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    return this.dataService.post(url, body, headers).pipe(
      retry(2),
      switchMap((response: any) => {
        this.loggerService.logDebug('revocation endpoint post response: ', response);
        return of(response);
      }),
      catchError((error) => {
        const errorMessage = `Revocation request failed`;
        this.loggerService.logError(errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }

  // https://tools.ietf.org/html/rfc7009
  // revokes an refresh token on the STS. This is only required in the code flow with refresh tokens.
  // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
  // This makes it possible to manage your own tokens.
  revokeRefreshToken(refreshToken?: any) {
    const refreshTok = refreshToken || this.storagePersistanceService.getRefreshToken();
    const body = this.urlService.createRevocationEndpointBodyRefreshToken(refreshTok);
    const url = this.urlService.getRevocationEndpointUrl();

    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    return this.dataService.post(url, body, headers).pipe(
      retry(2),
      switchMap((response: any) => {
        this.loggerService.logDebug('revocation endpoint post response: ', response);
        return of(response);
      }),
      catchError((error) => {
        const errorMessage = `Revocation request failed`;
        this.loggerService.logError(errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }

  getEndSessionUrl(): string | null {
    const idToken = this.storagePersistanceService.getIdToken();
    return this.urlService.createEndSessionUrl(idToken);
  }
}
