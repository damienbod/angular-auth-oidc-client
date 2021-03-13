import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataService } from '../../api/data.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
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
    private readonly storagePersistanceService: StoragePersistanceService,
    private readonly dataService: DataService
  ) {}

  // STEP 1 Code Flow
  codeFlowCallback(urlToCheck: string): Observable<CallbackContext> {
    const code = this.urlService.getUrlParameter(urlToCheck, 'code');
    const state = this.urlService.getUrlParameter(urlToCheck, 'state');
    const sessionState = this.urlService.getUrlParameter(urlToCheck, 'session_state') || null;

    if (!state) {
      this.loggerService.logDebug('no state in url');
      return throwError('no state in url');
    }

    if (!code) {
      this.loggerService.logDebug('no code in url');
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
  codeFlowCodeRequest(callbackContext: CallbackContext): Observable<CallbackContext> {
    const authStateControl = this.flowsDataService.getAuthStateControl();

    const isStateCorrect = this.tokenValidationService.validateStateFromHashCallback(callbackContext.state, authStateControl);

    if (!isStateCorrect) {
      this.loggerService.logWarning('codeFlowCodeRequest incorrect state');
      return throwError('codeFlowCodeRequest incorrect state');
    }

    const authWellKnown = this.storagePersistanceService.read('authWellKnownEndPoints');
    const tokenEndpoint = authWellKnown?.tokenEndpoint;
    if (!tokenEndpoint) {
      return throwError('Token Endpoint not defined');
    }

    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
    const bodyForCodeFlow = this.urlService.createBodyForCodeFlowCodeRequest(
      callbackContext.code,
      this.configurationProvider.openIDConfiguration?.customTokenParams
    );

    return this.dataService.post(tokenEndpoint, bodyForCodeFlow, headers).pipe(
      switchMap((response) => {
        let authResult: any = new Object();
        authResult = response;
        authResult.state = callbackContext.state;
        authResult.session_state = callbackContext.sessionState;

        callbackContext.authResult = authResult;
        return of(callbackContext);
      }),
      catchError((error) => {
        const { stsServer } = this.configurationProvider.getOpenIDConfiguration();
        const errorMessage = `OidcService code request ${stsServer}`;
        this.loggerService.logError(errorMessage, error);
        return throwError(errorMessage);
      })
    );
  }
}
