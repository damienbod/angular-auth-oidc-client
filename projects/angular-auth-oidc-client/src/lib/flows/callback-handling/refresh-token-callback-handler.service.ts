import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen, switchMap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { CallbackContext } from '../callback-context';

@Injectable()
export class RefreshTokenCallbackHandlerService {
  constructor(
    private readonly urlService: UrlService,
    private readonly loggerService: LoggerService,
    private readonly configurationProvider: ConfigurationProvider,
    private readonly dataService: DataService,
    private readonly storagePersistenceService: StoragePersistenceService
  ) {}

  // STEP 2 Refresh Token
  refreshTokensRequestTokens(
    callbackContext: CallbackContext,
    configId: string,
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const authWellknownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    const tokenEndpoint = authWellknownEndpoints?.tokenEndpoint;
    if (!tokenEndpoint) {
      return throwError('Token Endpoint not defined');
    }

    const data = this.urlService.createBodyForCodeFlowRefreshTokensRequest(callbackContext.refreshToken, configId, customParams);

    return this.dataService.post(tokenEndpoint, data, configId, headers).pipe(
      switchMap((response: any) => {
        this.loggerService.logDebug('token refresh response: ', response);
        let authResult: any = new Object();
        authResult = response;
        authResult.state = callbackContext.state;

        callbackContext.authResult = authResult;
        return of(callbackContext);
      }),
      retryWhen((error) => this.handleRefreshRetry(error, configId)),
      catchError((error) => {
        const { stsServer } = this.configurationProvider.getOpenIDConfiguration(configId);
        const errorMessage = `OidcService code request ${stsServer}`;
        this.loggerService.logError(errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }

  private handleRefreshRetry(errors: Observable<any>, configId: string): Observable<any> {
    return errors.pipe(
      mergeMap((error) => {
        // retry token refresh if there is no internet connection
        if (error && error instanceof HttpErrorResponse && error.error instanceof ProgressEvent && error.error.type === 'error') {
          const { stsServer, refreshTokenRetryInSeconds } = this.configurationProvider.getOpenIDConfiguration(configId);
          const errorMessage = `OidcService code request ${stsServer} - no internet connection`;
          this.loggerService.logWarning(errorMessage, error);
          return timer(refreshTokenRetryInSeconds * 1000);
        }
        return throwError(error);
      })
    );
  }
}
