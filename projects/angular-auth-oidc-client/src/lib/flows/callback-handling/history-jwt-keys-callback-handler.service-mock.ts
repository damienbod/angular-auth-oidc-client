import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { CallbackContext } from '../callback-context';

export class HistoryJwtKeysCallbackHandlerServiceMock {
  callbackHistoryAndResetJwtKeys(
    callbackContext: CallbackContext,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    return of(null);
  }
}
