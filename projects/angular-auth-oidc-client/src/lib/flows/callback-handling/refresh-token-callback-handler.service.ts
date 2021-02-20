import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { UrlService } from '../../utils/url/url.service';
import { CallbackContext } from '../callback-context';

@Injectable()
export class RefreshTokenCallbackHandlerService {
  constructor(
    private readonly urlService: UrlService,
    private readonly loggerService: LoggerService,
    private readonly configurationProvider: ConfigurationProvider,
    private readonly dataService: DataService,
    private readonly storagePersistanceService: StoragePersistanceService
  ) {}

  // STEP 2 Refresh Token
  refreshTokensRequestTokens(
    callbackContext: CallbackContext,
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const authWellKnown = this.storagePersistanceService.read('authWellKnownEndPoints');
    const tokenEndpoint = authWellKnown?.tokenEndpoint;
    if (!tokenEndpoint) {
      return throwError('Token Endpoint not defined');
    }

    const data = this.urlService.createBodyForCodeFlowRefreshTokensRequest(callbackContext.refreshToken, customParams);

    return this.dataService.post(tokenEndpoint, data, headers).pipe(
      switchMap((response: any) => {
        this.loggerService.logDebug('token refresh response: ', response);
        let authResult: any = new Object();
        authResult = response;
        authResult.state = callbackContext.state;

        callbackContext.authResult = authResult;
        return of(callbackContext);
      }),
      catchError((error) => {
        const errorMessage = `OidcService code request ${this.configurationProvider.openIDConfiguration.stsServer}`;
        this.loggerService.logError(errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }
}
