import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { CallbackContext } from '../callback-context';

@Injectable()
export class ImplicitFlowCallbackHandlerServiceMock {
  implicitFlowCallback(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], hash?: string): Observable<CallbackContext> {
    return of(null);
  }
}
