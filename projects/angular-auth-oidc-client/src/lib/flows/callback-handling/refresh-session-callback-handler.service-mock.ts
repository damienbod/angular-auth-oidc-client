import { Observable, of } from 'rxjs';
import { CallbackContext } from '../callback-context';

export class RefreshSessionCallbackHandlerServiceMock {
  // STEP 1 Refresh session
  refreshSessionWithRefreshTokens(): Observable<CallbackContext> {
    return of(null);
  }
}
