import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { CallbackContext } from '../callback-context';
import { createRenewCallbackContext } from '../callback-context.helper';

@Injectable({ providedIn: 'root' })
export class RefreshSessionCallbackHandlerService {
  private readonly loggerService = inject(LoggerService);
  private readonly authStateService = inject(AuthStateService);

  // STEP 1 Refresh session
  refreshSessionWithRefreshTokens(
    config: OpenIdConfiguration
  ): Observable<CallbackContext> {
    const refreshToken = this.authStateService.getRefreshToken(config);
    const idToken = this.authStateService.getIdToken(config);

    if (refreshToken) {
      // No state or nonce is written to the storage here: it is shared by all
      // tabs, so a login or a reset in another tab could overwrite it while the
      // refresh request is in flight and break the validation of this refresh
      const callbackContext: CallbackContext = createRenewCallbackContext(
        refreshToken,
        idToken
      );

      this.loggerService.logDebug(
        config,
        'found refresh code, obtaining new credentials with refresh code'
      );

      return of(callbackContext);
    } else {
      const errorMessage = 'no refresh token found, please login';

      this.loggerService.logError(config, errorMessage);

      return throwError(() => new Error(errorMessage));
    }
  }
}
