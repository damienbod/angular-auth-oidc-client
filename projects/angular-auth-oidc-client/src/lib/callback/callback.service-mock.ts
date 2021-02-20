import { Observable, of, Subject } from 'rxjs';
import { CallbackContext } from '../flows/callback-context';

export class CallbackServiceMock {
  private stsCallbackInternal$ = new Subject();

  get stsCallback$() {
    return this.stsCallbackInternal$.asObservable();
  }

  isCallback(currentUrl: string): boolean {
    return null;
  }

  handleCallbackAndFireEvents(currentCallbackUrl: string): Observable<CallbackContext> {
    return of(null);
  }
}
