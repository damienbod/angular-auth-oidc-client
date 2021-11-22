import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StateValidationResult } from '../../validation/state-validation-result';
import { StateValidationService } from '../../validation/state-validation.service';
import { CallbackContext } from '../callback-context';
import { ResetAuthDataService } from '../reset-auth-data.service';

@Injectable()
export class StateValidationCallbackHandlerService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly stateValidationService: StateValidationService,
    private readonly authStateService: AuthStateService,
    private readonly resetAuthDataService: ResetAuthDataService,
    @Inject(DOCUMENT) private readonly doc: any
  ) {}

  // STEP 4 All flows

  callbackStateValidation(callbackContext: CallbackContext, config: OpenIdConfiguration): Observable<CallbackContext> {
    const validationResult = this.stateValidationService.getValidatedStateResult(callbackContext, config);
    const { configId } = config;
    callbackContext.validationResult = validationResult;

    if (validationResult.authResponseIsValid) {
      this.authStateService.setAuthorizationData(validationResult.accessToken, callbackContext.authResult, config);

      return of(callbackContext);
    } else {
      const errorMessage = `authorizedCallback, token(s) validation failed, resetting. Hash: ${this.doc.location.hash}`;
      this.loggerService.logWarning(config, errorMessage);
      this.resetAuthDataService.resetAuthorizationData(configId);
      this.publishUnauthorizedState(callbackContext.validationResult, callbackContext.isRenewProcess);

      return throwError(() => new Error(errorMessage));
    }
  }

  private publishUnauthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean): void {
    this.authStateService.updateAndPublishAuthState({
      isAuthenticated: false,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }
}
