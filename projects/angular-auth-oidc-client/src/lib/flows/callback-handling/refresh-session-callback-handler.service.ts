import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionCallbackHandlerService {
  private readonly loggerService = inject(LoggerService);
  private readonly authStateService = inject(AuthStateService);
  private readonly flowsDataService = inject(FlowsDataService);

  // STEP 1 Refresh session
  refreshSessionWithRefreshTokens(
    config: OpenIdConfiguration
  ): Observable<CallbackContext> {
    const stateData =
      this.flowsDataService.getExistingOrCreateAuthStateControl(config);

    this.loggerService.logDebug(
      config,
      'RefreshSession created. Adding myautostate: ' + stateData
    );
    const refreshToken = this.authStateService.getRefreshToken(config);
    const idToken = this.authStateService.getIdToken(config);

    if (refreshToken) {
      const callbackContext: CallbackContext = {
        code: '',
        refreshToken,
        state: stateData,
        sessionState: null,
        authResult: null,
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: idToken,
      };

      this.loggerService.logDebug(
        config,
        'found refresh code, obtaining new credentials with refresh code'
      );
      // Nonce is not used with refresh tokens; but Key cloak may send it anyway
      this.flowsDataService.setNonce(
        TokenValidationService.refreshTokenNoncePlaceholder,
        config
      );

      return of(callbackContext);
    } else {
      const errorMessage = 'no refresh token found, please login';

      this.loggerService.logError(config, errorMessage);

      return throwError(() => new Error(errorMessage));
    }
  }
}
