import { Observable, of } from 'rxjs';
import { CallbackContext } from '../callback-context';

export class RefreshTokenCallbackHandlerServiceMock {
  // STEP 2 Refresh Token
  refreshTokensRequestTokens(
    callbackContext: CallbackContext,
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    return of(null);
  }
}
