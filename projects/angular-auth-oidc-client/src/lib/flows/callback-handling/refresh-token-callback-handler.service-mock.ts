import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { CallbackContext } from '../callback-context';

export class RefreshTokenCallbackHandlerServiceMock {
  // STEP 2 Refresh Token
  refreshTokensRequestTokens(
    callbackContext: CallbackContext,
    config: OpenIdConfiguration,
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    return of(null);
  }
}
