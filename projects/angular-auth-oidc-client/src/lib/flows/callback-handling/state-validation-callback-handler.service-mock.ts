import { Observable, of } from 'rxjs';
import { CallbackContext } from '../callback-context';

export class StateValidationCallbackHandlerServiceMock {
  callbackStateValidation(callbackContext: CallbackContext): Observable<CallbackContext> {
    return of(null);
  }
}
