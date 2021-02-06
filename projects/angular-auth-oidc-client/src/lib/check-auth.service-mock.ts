import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class CheckAuthServiceMock {
  checkAuth(url?: string): Observable<boolean> {
    return of(null);
  }

  checkAuthIncludingServer(): Observable<boolean> {
    return of(null);
  }
}
