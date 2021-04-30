import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
import { RefreshSessionCallbackHandlerService } from './callback-handling/refresh-session-callback-handler.service';
import { RefreshTokenCallbackHandlerService } from './callback-handling/refresh-token-callback-handler.service';
import { StateValidationCallbackHandlerService } from './callback-handling/state-validation-callback-handler.service';
import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';
import { Observable } from 'rxjs';

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

  processCodeFlowCallback(urlToCheck: string): Observable<CallbackContext> {
    return this.codeFlowCallbackHandlerService.codeFlowCallback(urlToCheck).pipe(
      switchMap((callbackContext) => this.codeFlowCallbackHandlerService.codeFlowCodeRequest(callbackContext)),
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processSilentRenewCodeFlowCallback(firstContext: CallbackContext): Observable<CallbackContext> {
    return this.codeFlowCallbackHandlerService.codeFlowCodeRequest(firstContext).pipe(
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processImplicitFlowCallback(hash?: string): Observable<CallbackContext> {
    return this.implicitFlowCallbackHandlerService.implicitFlowCallback(hash).pipe(
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }

  processRefreshToken(customParams?: { [key: string]: string | number | boolean }): Observable<CallbackContext> {
    return this.refreshSessionCallbackHandlerService.refreshSessionWithRefreshTokens().pipe(
      switchMap((callbackContext) => this.refreshTokenCallbackHandlerService.refreshTokensRequestTokens(callbackContext, customParams)),
      switchMap((callbackContext) => this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(callbackContext)),
      switchMap((callbackContext) => this.stateValidationCallbackHandlerService.callbackStateValidation(callbackContext)),
      switchMap((callbackContext) => this.userHandlerService.callbackUser(callbackContext))
    );
  }
}
