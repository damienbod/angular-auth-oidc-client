import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
import { RefreshSessionCallbackHandlerService } from './callback-handling/refresh-session-callback-handler.service';
import { RefreshTokenCallbackHandlerService } from './callback-handling/refresh-token-callback-handler.service';
import { StateValidationCallbackHandlerService } from './callback-handling/state-validation-callback-handler.service';
import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';

@Injectable({ providedIn: 'root' })
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

  processCodeFlowCallback(
    urlToCheck: string,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    return this.codeFlowCallbackHandlerService
      .codeFlowCallback(urlToCheck, config)
      .pipe(
        concatMap((callbackContext) =>
          this.codeFlowCallbackHandlerService.codeFlowCodeRequest(
            callbackContext,
            config
          )
        ),
        concatMap((callbackContext) =>
          this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.stateValidationCallbackHandlerService.callbackStateValidation(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.userHandlerService.callbackUser(
            callbackContext,
            config,
            allConfigs
          )
        )
      );
  }

  processSilentRenewCodeFlowCallback(
    firstContext: CallbackContext,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    return this.codeFlowCallbackHandlerService
      .codeFlowCodeRequest(firstContext, config)
      .pipe(
        concatMap((callbackContext) =>
          this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.stateValidationCallbackHandlerService.callbackStateValidation(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.userHandlerService.callbackUser(
            callbackContext,
            config,
            allConfigs
          )
        )
      );
  }

  processImplicitFlowCallback(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    hash?: string
  ): Observable<CallbackContext> {
    return this.implicitFlowCallbackHandlerService
      .implicitFlowCallback(config, allConfigs, hash)
      .pipe(
        concatMap((callbackContext) =>
          this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.stateValidationCallbackHandlerService.callbackStateValidation(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.userHandlerService.callbackUser(
            callbackContext,
            config,
            allConfigs
          )
        )
      );
  }

  processRefreshToken(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    return this.refreshSessionCallbackHandlerService
      .refreshSessionWithRefreshTokens(config)
      .pipe(
        concatMap((callbackContext) =>
          this.refreshTokenCallbackHandlerService.refreshTokensRequestTokens(
            callbackContext,
            config,
            customParamsRefresh
          )
        ),
        concatMap((callbackContext) =>
          this.historyJwtKeysCallbackHandlerService.callbackHistoryAndResetJwtKeys(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.stateValidationCallbackHandlerService.callbackStateValidation(
            callbackContext,
            config,
            allConfigs
          )
        ),
        concatMap((callbackContext) =>
          this.userHandlerService.callbackUser(
            callbackContext,
            config,
            allConfigs
          )
        )
      );
  }
}
