import { Observable, of } from 'rxjs';
import { CallbackContext } from '../callback-context';

export class CodeFlowCallbackHandlerServiceMock {
  codeFlowCallback(urlToCheck: string): Observable<CallbackContext> {
    return of(null);
  }

  codeFlowCodeRequest(callbackContext: CallbackContext): Observable<CallbackContext> {
    return of(null);
  }
}
