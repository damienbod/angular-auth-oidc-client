import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { CallbackContext } from '../callback-context';

export class RefreshSessionCallbackHandlerServiceMock {
  refreshSessionWithRefreshTokens(config: OpenIdConfiguration): Observable<CallbackContext> {
    return of(null);
  }
}
