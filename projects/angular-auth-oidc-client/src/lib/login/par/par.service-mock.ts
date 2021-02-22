import { Observable, of } from 'rxjs';
import { ParResponse } from './par-response';

export class ParServiceMock {
  postParRequest(customParams?: { [key: string]: string | number | boolean }): Observable<ParResponse> {
    return of(null);
  }
}
