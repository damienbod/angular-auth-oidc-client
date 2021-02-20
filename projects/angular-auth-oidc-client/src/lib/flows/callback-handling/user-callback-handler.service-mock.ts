import { Observable, of } from 'rxjs';
import { CallbackContext } from '../callback-context';

export class UserCallbackHandlerServiceMock {
  callbackUser(callbackContext: CallbackContext): Observable<CallbackContext> {
    return of(null);
  }
}
