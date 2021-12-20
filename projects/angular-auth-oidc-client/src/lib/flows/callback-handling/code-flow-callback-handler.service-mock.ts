import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { CallbackContext } from '../callback-context';

export class CodeFlowCallbackHandlerServiceMock {
  codeFlowCallback(urlToCheck: string, config: OpenIdConfiguration): Observable<CallbackContext> {
    return of(null);
  }

  codeFlowCodeRequest(callbackContext: CallbackContext, config: OpenIdConfiguration): Observable<CallbackContext> {
    return of(null);
  }
}
