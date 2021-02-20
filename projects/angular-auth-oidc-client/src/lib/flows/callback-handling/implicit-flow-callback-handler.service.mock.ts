import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CallbackContext } from '../callback-context';

@Injectable()
export class ImplicitFlowCallbackHandlerServiceMock {
  implicitFlowCallback(hash?: string): Observable<CallbackContext> {
    return of(null);
  }
}
