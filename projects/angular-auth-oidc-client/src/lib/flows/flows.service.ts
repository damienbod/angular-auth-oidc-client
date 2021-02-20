import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { UrlService } from '../utils/url/url.service';
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
import { RefreshSessionCallbackHandlerService } from './callback-handling/refresh-session-callback-handler.service';
import { StateValidationCallbackHandlerService } from './callback-handling/state-validation-callback-handler.service';
import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';

@Injectable()
export class FlowsService {
  constructor(
    private readonly urlService: UrlService,
    private readonly loggerService: LoggerService,
    private readonly configurationProvider: ConfigurationProvider,
    private readonly dataService: DataService,
    private readonly storagePersistanceService: StoragePersistanceService,
    private readonly codeFlowCallbackHandlerService: CodeFlowCallbackHandlerService,
    private readonly implicitFlowCallbackHandlerService: ImplicitFlowCallbackHandlerService,
    private readonly historyJwtKeysCallbackHandlerService: HistoryJwtKeysCallbackHandlerService,
    private readonly userHandlerService: UserCallbackHandlerService,
    private readonly stateValidationCallbackHandlerService: StateValidationCallbackHandlerService,
    private readonly refreshSessionCallbackHandlerService: RefreshSessionCallbackHandlerService
  ) {}

  processCodeFlowCallback(urlToCheck: string) {
    return this.codeFlowCallbackHandlerService.codeFlowCallback(urlToCheck).pipe(
      switchMap((callbackContext) => this.codeFlowCallbackHandlerService.codeFlowCodeRequest(callbackContext)),
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processSilentRenewCodeFlowCallback(firstContext: CallbackContext) {
    return this.codeFlowCallbackHandlerService.codeFlowCodeRequest(firstContext).pipe(
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processImplicitFlowCallback(hash?: string) {
    return this.implicitFlowCallbackHandlerService.implicitFlowCallback(hash).pipe(
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processRefreshToken(customParams?: { [key: string]: string | number | boolean }) {
    return this.refreshSessionCallbackHandlerService.refreshSessionWithRefreshTokens().pipe(
      switchMap((callbackContext) => this.refreshTokensRequestTokens(callbackContext, customParams)),
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  // STEP 2 Refresh Token
  private refreshTokensRequestTokens(
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
