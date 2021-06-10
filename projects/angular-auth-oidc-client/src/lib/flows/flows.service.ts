import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
import { RefreshSessionCallbackHandlerService } from './callback-handling/refresh-session-callback-handler.service';
import { RefreshTokenCallbackHandlerService } from './callback-handling/refresh-token-callback-handler.service';
import { StateValidationCallbackHandlerService } from './callback-handling/state-validation-callback-handler.service';
import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';

@Injectable()
export class FlowsService {
  constructor(
    private readonly codeFlowCallbackHandlerService: CodeFlowCallbackHandlerService,
    private readonly implicitFlowCallbackHandlerService: ImplicitFlowCallbackHandlerService,
    private readonly historyJwtKeysCallbackHandlerService: HistoryJwtKeysCallbackHandlerService,
    private readonly userHandlerService: UserCallbackHandlerService,
    private readonly stateValidationCallbackHandlerService: StateValidationCallbackHandlerService,
    private readonly refreshSessionCallbackHandlerService: RefreshSessionCallbackHandlerService,
    private readonly refreshTokenCallbackHandlerService: RefreshTokenCallbackHandlerService
  ) {}

  processCodeFlowCallback(urlToCheck: string, configId: string): Observable<CallbackContext> {
    return this.codeFlowCallbackHandlerService.codeFlowCallback(urlToCheck, configId).pipe(
      concatMap((callbackContext) => this.codeFlowCallbackHandlerService.codeFlowCodeRequest(callbackContext, configId)),
      concatMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext, configId)),
      concatMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext, configId)),
      concatMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext, configId))
    );
  }

  processSilentRenewCodeFlowCallback(firstContext: CallbackContext, configId: string): Observable<CallbackContext> {
    return this.codeFlowCallbackHandlerService.codeFlowCodeRequest(firstContext, configId).pipe(
      concatMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext, configId)),
      concatMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext, configId)),
      concatMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext, configId))
    );
  }

  processImplicitFlowCallback(configId: string, hash?: string): Observable<CallbackContext> {
    return this.implicitFlowCallbackHandlerService.implicitFlowCallback(configId, hash).pipe(
      concatMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext, configId)),
      concatMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext, configId)),
      concatMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext, configId))
    );
  }

  processRefreshToken(configId: string, customParamsRefresh?: { [key: string]: string | number | boolean }): Observable<CallbackContext> {
    return this.refreshSessionCallbackHandlerService.refreshSessionWithRefreshTokens(configId).pipe(
      concatMap((callbackContext) =>
        this.refreshTokenCallbackHandlerService.refreshTokensRequestTokens(callbackContext, configId, customParamsRefresh)
      ),
      concatMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext, configId)),
      concatMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext, configId)),
      concatMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext, configId))
    );
  }
}
