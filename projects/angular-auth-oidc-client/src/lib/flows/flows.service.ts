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
import { UserService } from '../userData/user-service';
import { UrlService } from '../utils/url/url.service';
import { StateValidationResult } from '../validation/state-validation-result';
import { StateValidationService } from '../validation/state-validation.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { ValidationResult } from '../validation/validation-result';
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { FlowsDataService } from './flows-data.service';
import { ResetAuthDataService } from './reset-auth-data.service';
import { SigninKeyDataService } from './signin-key-data.service';

@Injectable()
export class FlowsService {
  constructor(
    private readonly urlService: UrlService,
    private readonly loggerService: LoggerService,
    private readonly configurationProvider: ConfigurationProvider,
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly signinKeyDataService: SigninKeyDataService,
    private readonly dataService: DataService,
    private readonly userService: UserService,
    private readonly stateValidationService: StateValidationService,
    private readonly storagePersistanceService: StoragePersistanceService,
    private readonly codeFlowCallbackHandlerService: CodeFlowCallbackHandlerService,
    private readonly resetAuthDataService: ResetAuthDataService
  ) {}

  processCodeFlowCallback(urlToCheck: string) {
    return this.codeFlowCallbackHandlerService.codeFlowCallback(urlToCheck).pipe(
      switchMap((callbackContext) => this.codeFlowCallbackHandlerService.codeFlowCodeRequest(callbackContext)),
      switchMap((callbackContext) => this.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.callbackUser(callbackContext))
    );
  }

  processSilentRenewCodeFlowCallback(firstContext: CallbackContext) {
    return this.codeFlowCallbackHandlerService.codeFlowCodeRequest(firstContext).pipe(
      switchMap((callbackContext) => this.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.callbackUser(callbackContext))
    );
  }

  processImplicitFlowCallback(hash?: string) {
    return this.implicitFlowCallback(hash).pipe(
      switchMap((callbackContext) => this.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.callbackUser(callbackContext))
    );
  }

  processRefreshToken(customParams?: { [key: string]: string | number | boolean }) {
    return this.refreshSessionWithRefreshTokens().pipe(
      switchMap((callbackContext) => this.refreshTokensRequestTokens(callbackContext, customParams)),
      switchMap((callbackContext) => this.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.callbackUser(callbackContext))
    );
  }

  // STEP 1 Implicit Flow
  private implicitFlowCallback(hash?: string): Observable<CallbackContext> {
    const isRenewProcessData = this.flowsDataService.isSilentRenewRunning();

    this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
    if (!isRenewProcessData) {
      this.resetAuthDataService.resetAuthorizationData();
    }

    hash = hash || window.location.hash.substr(1);

    const authResult: any = hash.split('&').reduce((resultData: any, item: string) => {
      const parts = item.split('=');
      resultData[parts.shift() as string] = parts.join('=');
      return resultData;
    }, {});

    const callbackContext = {
      code: null,
      refreshToken: null,
      state: null,
      sessionState: null,
      authResult,
      isRenewProcess: isRenewProcessData,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    return of(callbackContext);
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

  // STEP 3 Code Flow, STEP 2 Implicit Flow, STEP 3 Refresh Token
  private callbackHistoryAndResetJwtKeys(callbackContext: CallbackContext): Observable<CallbackContext> {
    this.storagePersistanceService.write('authnResult', callbackContext.authResult);

    if (this.historyCleanUpTurnedOn() && !callbackContext.isRenewProcess) {
      this.resetBrowserHistory();
    } else {
      this.loggerService.logDebug('history clean up inactive');
    }

    if (callbackContext.authResult.error) {
      const errorMessage = `authorizedCallbackProcedure came with error: ${callbackContext.authResult.error}`;
      this.loggerService.logDebug(errorMessage);
      this.resetAuthDataService.resetAuthorizationData();
      this.flowsDataService.setNonce('');
      this.handleResultErrorFromCallback(callbackContext.authResult, callbackContext.isRenewProcess);
      return throwError(errorMessage);
    }

    this.loggerService.logDebug(callbackContext.authResult);
    this.loggerService.logDebug('authorizedCallback created, begin token validation');

    return this.signinKeyDataService.getSigningKeys().pipe(
      switchMap((jwtKeys) => {
        if (jwtKeys) {
          callbackContext.jwtKeys = jwtKeys;

          return of(callbackContext);
        }

        const errorMessage = `Failed to retrieve signing key`;
        this.loggerService.logWarning(errorMessage);
        return throwError(errorMessage);
      }),
      catchError((err) => {
        const errorMessage = `Failed to retrieve signing key with error: ${err}`;
        this.loggerService.logWarning(errorMessage);
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

  // STEP 5 userData
  private callbackUser(callbackContext: CallbackContext): Observable<CallbackContext> {
    if (!this.configurationProvider.openIDConfiguration.autoUserinfo) {
      if (!callbackContext.isRenewProcess) {
        // userData is set to the id_token decoded, auto get user data set to false
        this.userService.setUserDataToStore(callbackContext.validationResult.decodedIdToken);
      }

      this.publishAuthorizedState(callbackContext.validationResult, callbackContext.isRenewProcess);
      return of(callbackContext);
    }

    return this.userService
      .getAndPersistUserDataInStore(
        callbackContext.isRenewProcess,
        callbackContext.validationResult.idToken,
        callbackContext.validationResult.decodedIdToken
      )
      .pipe(
        switchMap((userData) => {
          if (!!userData) {
            if (!callbackContext.refreshToken) {
              this.flowsDataService.setSessionState(callbackContext.authResult.session_state);
            }
            this.publishAuthorizedState(callbackContext.validationResult, callbackContext.isRenewProcess);
            return of(callbackContext);
          } else {
            this.resetAuthDataService.resetAuthorizationData();
            this.publishUnauthorizedState(callbackContext.validationResult, callbackContext.isRenewProcess);
            const errorMessage = `Called for userData but they were ${userData}`;
            this.loggerService.logWarning(errorMessage);
            return throwError(errorMessage);
          }
        }),
        catchError((err) => {
          const errorMessage = `Failed to retrieve user info with error:  ${err}`;
          this.loggerService.logWarning(errorMessage);
          return throwError(errorMessage);
        })
      );
  }

  private publishAuthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
    this.authStateService.updateAndPublishAuthState({
      authorizationState: AuthorizedState.Authorized,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }

  private publishUnauthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
    this.authStateService.updateAndPublishAuthState({
      authorizationState: AuthorizedState.Unauthorized,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }

  private handleResultErrorFromCallback(result: any, isRenewProcess: boolean) {
    let validationResult = ValidationResult.SecureTokenServerError;

    if ((result.error as string) === 'login_required') {
      validationResult = ValidationResult.LoginRequired;
    }

    this.authStateService.updateAndPublishAuthState({
      authorizationState: AuthorizedState.Unauthorized,
      validationResult,
      isRenewProcess,
    });
  }

  private historyCleanUpTurnedOn() {
    return !this.configurationProvider.openIDConfiguration.historyCleanupOff;
  }

  private resetBrowserHistory() {
    window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
  }
}
