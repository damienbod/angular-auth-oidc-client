import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthStateService } from '../../authState/auth-state.service';
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

  callbackStateValidation(callbackContext: CallbackContext): Observable<CallbackContext> {
    const validationResult = this.stateValidationService.getValidatedStateResult(callbackContext);
    callbackContext.validationResult = validationResult;

    if (validationResult.authResponseIsValid) {
      this.authStateService.setAuthorizationData(validationResult.accessToken, callbackContext.authResult);
      return of(callbackContext);
    } else {
      const errorMessage = `authorizedCallback, token(s) validation failed, resetting. Hash: ${this.doc.location.hash}`;
      this.loggerService.logWarning(errorMessage);
      this.resetAuthDataService.resetAuthorizationData();
      this.publishUnauthorizedState(callbackContext.validationResult, callbackContext.isRenewProcess);
      return throwError(errorMessage);
    }
  }

  private publishUnauthorizedState(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
    this.authStateService.updateAndPublishAuthState({
      isAuthorized: false,
      validationResult: stateValidationResult.state,
      isRenewProcess,
    });
  }
}
