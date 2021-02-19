import { Observable, of } from 'rxjs';
import { CallbackContext } from '../callback-context';

export class HistoryJwtKeysCallbackHandlerServiceMock {
  callbackHistoryAndResetJwtKeys(callbackContext: CallbackContext): Observable<CallbackContext> {
    return of(null);
  }
}
