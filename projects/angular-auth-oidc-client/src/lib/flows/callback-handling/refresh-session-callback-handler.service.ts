import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthStateService } from '../../authState/auth-state.service';
import { LoggerService } from '../../logging/logger.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';

@Injectable()
export class RefreshSessionCallbackHandlerService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService
  ) {}

  // STEP 1 Refresh session
  refreshSessionWithRefreshTokens(): Observable<CallbackContext> {
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
}
