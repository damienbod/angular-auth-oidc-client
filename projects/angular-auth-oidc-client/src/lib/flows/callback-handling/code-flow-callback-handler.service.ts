import { HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen, switchMap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { AuthResult, CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { isNetworkError } from './error-helper';

@Injectable({ providedIn: 'root' })
export class CodeFlowCallbackHandlerService {
  private readonly urlService = inject(UrlService);
  private readonly loggerService = inject(LoggerService);
  private readonly tokenValidationService = inject(TokenValidationService);
  private readonly flowsDataService = inject(FlowsDataService);
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly dataService = inject(DataService);

  // STEP 1 Code Flow
  codeFlowCallback(
    urlToCheck: string,
    config: OpenIdConfiguration
  ): Observable<CallbackContext> {
    const code = this.urlService.getUrlParameter(urlToCheck, 'code');
    const state = this.urlService.getUrlParameter(urlToCheck, 'state');
    const sessionState = this.urlService.getUrlParameter(
      urlToCheck,
      'session_state'
    );

    if (!state) {
      this.loggerService.logDebug(config, 'no state in url');

      return throwError(() => new Error('no state in url'));
    }

    if (!code) {
      this.loggerService.logDebug(config, 'no code in url');

      return throwError(() => new Error('no code in url'));
    }

    this.loggerService.logDebug(
      config,
      'running validation for callback',
      urlToCheck
    );

    const initialCallbackContext: CallbackContext = {
      code,
      refreshToken: '',
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
  codeFlowCodeRequest(
    callbackContext: CallbackContext,
    config: OpenIdConfiguration
  ): Observable<CallbackContext> {
    const authStateControl = this.flowsDataService.getAuthStateControl(config);
    const isStateCorrect =
      this.tokenValidationService.validateStateFromHashCallback(
        callbackContext.state,
        authStateControl,
        config
      );

    if (!isStateCorrect) {
      return throwError(() => new Error('codeFlowCodeRequest incorrect state'));
    }

    const authWellknownEndpoints = this.storagePersistenceService.read(
      'authWellKnownEndPoints',
      config
    );
    const tokenEndpoint = authWellknownEndpoints?.tokenEndpoint;

    if (!tokenEndpoint) {
      return throwError(() => new Error('Token Endpoint not defined'));
    }

    let headers: HttpHeaders = new HttpHeaders();

    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const bodyForCodeFlow = this.urlService.createBodyForCodeFlowCodeRequest(
      callbackContext.code,
      config,
      config?.customParamsCodeRequest
    );

    return this.dataService
      .post(tokenEndpoint, bodyForCodeFlow, config, headers)
      .pipe(
        switchMap((response) => {
          if (response) {
            const authResult: AuthResult = {
              ...response,
              state: callbackContext.state,
              session_state: callbackContext.sessionState,
            };

            callbackContext.authResult = authResult;
          }

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

  private handleRefreshRetry(
    errors: Observable<unknown>,
    config: OpenIdConfiguration
  ): Observable<unknown> {
    return errors.pipe(
      mergeMap((error) => {
        // retry token refresh if there is no internet connection
        if (isNetworkError(error)) {
          const { authority, refreshTokenRetryInSeconds } = config;
          const errorMessage = `OidcService code request ${authority} - no internet connection`;

          this.loggerService.logWarning(config, errorMessage, error);

          return timer((refreshTokenRetryInSeconds ?? 0) * 1000);
        }

        return throwError(() => error);
      })
    );
  }
}
