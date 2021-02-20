import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { UrlService } from '../utils/url/url.service';
import { StateValidationResult } from '../validation/state-validation-result';
import { StateValidationService } from '../validation/state-validation.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';
import { FlowsDataService } from './flows-data.service';
import { ResetAuthDataService } from './reset-auth-data.service';

@Injectable()
export class FlowsService {
  constructor(
    private readonly urlService: UrlService,
    private readonly loggerService: LoggerService,
    private readonly configurationProvider: ConfigurationProvider,
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly dataService: DataService,
    private readonly stateValidationService: StateValidationService,
    private readonly storagePersistanceService: StoragePersistanceService,
    private readonly codeFlowCallbackHandlerService: CodeFlowCallbackHandlerService,
    private readonly resetAuthDataService: ResetAuthDataService,
    private readonly implicitFlowCallbackHandlerService: ImplicitFlowCallbackHandlerService,
    private readonly historyJwtKeysCallbackHandlerService: HistoryJwtKeysCallbackHandlerService,
    private readonly userHandlerService: UserCallbackHandlerService
  ) {}

  processCodeFlowCallback(urlToCheck: string) {
    return this.codeFlowCallbackHandlerService.codeFlowCallback(urlToCheck).pipe(
      switchMap((callbackContext) => this.codeFlowCallbackHandlerService.codeFlowCodeRequest(callbackContext)),
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processSilentRenewCodeFlowCallback(firstContext: CallbackContext) {
    return this.codeFlowCallbackHandlerService.codeFlowCodeRequest(firstContext).pipe(
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processImplicitFlowCallback(hash?: string) {
    return this.implicitFlowCallbackHandlerService.implicitFlowCallback(hash).pipe(
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processRefreshToken(customParams?: { [key: string]: string | number | boolean }) {
    return this.refreshSessionWithRefreshTokens().pipe(
      switchMap((callbackContext) => this.refreshTokensRequestTokens(callbackContext, customParams)),
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  // STEP 1 Refresh session
  private refreshSessionWithRefreshTokens(): Observable<CallbackContext> {
    const stateData = this.flowsDataService.getExistingOrCreateAuthStateControl();
    this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + stateData);
    const refreshToken = this.authStateService.getRefreshToken();
    const idToken = this.authStateService.getIdToken();

    if (refreshToken) {
      const callbackContext = {
        code: null,
        refreshToken,
        state: stateData,
        sessionState: null,
        authResult: null,
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: idToken,
      };

      this.loggerService.logDebug('found refresh code, obtaining new credentials with refresh code');
      // Nonce is not used with refresh tokens; but Keycloak may send it anyway
      this.flowsDataService.setNonce(TokenValidationService.refreshTokenNoncePlaceholder);

      return of(callbackContext);
    } else {
      const errorMessage = 'no refresh token found, please login';
      this.loggerService.logError(errorMessage);
      return throwError(errorMessage);
    }
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

  // STEP 4 All flows
  private callbackStateValidation(callbackContext: CallbackContext): Observable<CallbackContext> {
    const validationResult = this.stateValidationService.getValidatedStateResult(callbackContext);
    callbackContext.validationResult = validationResult;

    if (validationResult.authResponseIsValid) {
      this.authStateService.setAuthorizationData(validationResult.accessToken, callbackContext.authResult);
      return of(callbackContext);
    } else {
      const errorMessage = `authorizedCallback, token(s) validation failed, resetting. Hash: ${window.location.hash}`;
      this.loggerService.logWarning(errorMessage);
      this.resetAuthDataService.resetAuthorizationData();
      this.publishUnauthorizedState(callbackContext.validationResult, callbackContext.isRenewProcess);
      return throwError(errorMessage);
    }
  }

  private publishUnauthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
    this.authStateService.updateAndPublishAuthState({
      authorizationState: AuthorizedState.Unauthorized,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }
}
