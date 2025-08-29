
import { inject, Injectable, DOCUMENT } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StateValidationResult } from '../../validation/state-validation-result';
import { StateValidationService } from '../../validation/state-validation.service';
import { CallbackContext } from '../callback-context';
import { ResetAuthDataService } from '../reset-auth-data.service';

@Injectable({ providedIn: 'root' })
export class StateValidationCallbackHandlerService {
  private readonly loggerService = inject(LoggerService);
  private readonly stateValidationService = inject(StateValidationService);
  private readonly authStateService = inject(AuthStateService);
  private readonly resetAuthDataService = inject(ResetAuthDataService);
  private readonly document = inject(DOCUMENT);

  // STEP 4 All flows
  callbackStateValidation(
    callbackContext: CallbackContext,
    configuration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    return this.stateValidationService
      .getValidatedStateResult(callbackContext, configuration)
      .pipe(
        map((validationResult: StateValidationResult) => {
          callbackContext.validationResult = validationResult;

          if (validationResult.authResponseIsValid) {
            this.authStateService.setAuthorizationData(
              validationResult.accessToken,
              callbackContext.authResult,
              configuration,
              allConfigs
            );

            return callbackContext;
          } else {
            const errorMessage = `authorizedCallback, token(s) validation failed, resetting. Hash: ${this.document.location.hash}`;

            this.loggerService.logWarning(configuration, errorMessage);
            this.resetAuthDataService.resetAuthorizationData(
              configuration,
              allConfigs
            );
            this.publishUnauthorizedState(
              callbackContext.validationResult,
              callbackContext.isRenewProcess,
              configuration.configId
            );

            throw new Error(errorMessage);
          }
        })
      );
  }

  private publishUnauthorizedState(
    stateValidationResult: StateValidationResult,
    isRenewProcess: boolean,
    configId?: string
  ): void {
    this.authStateService.updateAndPublishAuthState({
      isAuthenticated: false,
      validationResult: stateValidationResult.state,
      isRenewProcess,
      configId,
    });
  }
}
