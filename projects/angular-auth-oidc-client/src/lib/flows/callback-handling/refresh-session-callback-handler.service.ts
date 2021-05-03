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
  refreshSessionWithRefreshTokens(configId: string): Observable<CallbackContext> {
    const stateData = this.flowsDataService.getExistingOrCreateAuthStateControl(configId);
    this.loggerService.logDebug(configId, 'RefreshSession created. Adding myautostate: ' + stateData);
    const refreshToken = this.authStateService.getRefreshToken(configId);
    const idToken = this.authStateService.getIdToken(configId);

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

      this.loggerService.logDebug(configId, 'found refresh code, obtaining new credentials with refresh code');
      // Nonce is not used with refresh tokens; but Key cloak may send it anyway
      this.flowsDataService.setNonce(TokenValidationService.refreshTokenNoncePlaceholder, configId);

      return of(callbackContext);
    } else {
      const errorMessage = 'no refresh token found, please login';
      this.loggerService.logError(configId, errorMessage);
      return throwError(errorMessage);
    }
  }
}
