import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen, switchMap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';

@Injectable()
export class CodeFlowCallbackHandlerService {
  constructor(
    private readonly urlService: UrlService,
    private readonly loggerService: LoggerService,
    private readonly tokenValidationService: TokenValidationService,
    private readonly flowsDataService: FlowsDataService,
    private readonly configurationProvider: ConfigurationProvider,
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly dataService: DataService
  ) {}

  // STEP 1 Code Flow
  codeFlowCallback(urlToCheck: string, configId: string): Observable<CallbackContext> {
    const code = this.urlService.getUrlParameter(urlToCheck, 'code');
    const state = this.urlService.getUrlParameter(urlToCheck, 'state');
    const sessionState = this.urlService.getUrlParameter(urlToCheck, 'session_state') || null;

    if (!state) {
      this.loggerService.logDebug(configId, 'no state in url');
      return throwError('no state in url');
    }

    if (!code) {
      this.loggerService.logDebug(configId, 'no code in url');
      return throwError('no code in url');
    }

    this.loggerService.logDebug('running validation for callback', urlToCheck);

    const initialCallbackContext = {
      code,
      refreshToken: null,
      state,
      sessionState,
      authResult: null,
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    return of(initialCallbackContext);
  }

  // STEP 2 Code Flow //  Code Flow Silent Renew starts here
  codeFlowCodeRequest(callbackContext: CallbackContext, configId: string): Observable<CallbackContext> {
    const authStateControl = this.flowsDataService.getAuthStateControl();

    const isStateCorrect = this.tokenValidationService.validateStateFromHashCallback(callbackContext.state, authStateControl, configId);

    if (!isStateCorrect) {
      this.loggerService.logWarning(configId, 'codeFlowCodeRequest incorrect state');
      return throwError('codeFlowCodeRequest incorrect state');
    }

    const authWellKnown = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    const tokenEndpoint = authWellKnown?.tokenEndpoint;
    if (!tokenEndpoint) {
      return throwError('Token Endpoint not defined');
    }

    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const config = this.configurationProvider.getOpenIDConfiguration(configId);

    const bodyForCodeFlow = this.urlService.createBodyForCodeFlowCodeRequest(callbackContext.code, config?.customTokenParams);

    return this.dataService.post(tokenEndpoint, bodyForCodeFlow, configId, headers).pipe(
      switchMap((response) => {
        let authResult: any = new Object();
        authResult = response;
        authResult.state = callbackContext.state;
        authResult.session_state = callbackContext.sessionState;

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
