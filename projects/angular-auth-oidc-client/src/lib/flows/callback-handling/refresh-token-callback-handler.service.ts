import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen, switchMap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { CallbackContext } from '../callback-context';

@Injectable()
export class RefreshTokenCallbackHandlerService {
  constructor(
    private readonly urlService: UrlService,
    private readonly loggerService: LoggerService,
    private readonly dataService: DataService,
    private readonly storagePersistenceService: StoragePersistenceService
  ) {}

  // STEP 2 Refresh Token
  refreshTokensRequestTokens(
    callbackContext: CallbackContext,
    config: OpenIdConfiguration,
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const authWellknownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints', config);
    const tokenEndpoint = authWellknownEndpoints?.tokenEndpoint;
    if (!tokenEndpoint) {
      return throwError(() => new Error('Token Endpoint not defined'));
    }

    const data = this.urlService.createBodyForCodeFlowRefreshTokensRequest(callbackContext.refreshToken, config, customParamsRefresh);

    return this.dataService.post(tokenEndpoint, data, config, headers).pipe(
      switchMap((response: any) => {
        this.loggerService.logDebug(config, 'token refresh response: ', response);
        // TODO FGO LOOK AT THIS
        let authResult: any = new Object();
        authResult = response;
        authResult.state = callbackContext.state;

        callbackContext.authResult = authResult;

        return of(callbackContext);
      }),
      retryWhen((error) => this.handleRefreshRetry(error, config)),
      catchError((error) => {
        const { authority } = config;
        const errorMessage = `OidcService code request ${authority}`;
        this.loggerService.logError(config, errorMessage, error);

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private handleRefreshRetry(errors: Observable<any>, config: OpenIdConfiguration): Observable<any> {
    return errors.pipe(
      mergeMap((error) => {
        // retry token refresh if there is no internet connection
        if (error && error instanceof HttpErrorResponse && error.error instanceof ProgressEvent && error.error.type === 'error') {
          const { authority, refreshTokenRetryInSeconds } = config;
          const errorMessage = `OidcService code request ${authority} - no internet connection`;
          this.loggerService.logWarning(config, errorMessage, error);

          return timer(refreshTokenRetryInSeconds * 1000);
        }

        return throwError(() => new Error(error));
      })
    );
  }
}
