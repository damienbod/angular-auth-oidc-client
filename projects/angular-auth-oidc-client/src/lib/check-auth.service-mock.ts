import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoginResponse } from './login/login-response';

@Injectable()
export class CheckAuthServiceMock {
  checkAuth(passedConfigId: string, url?: string): Observable<LoginResponse> {
    return of(null);
  }

  checkAuthMultiple(passedConfigId: string, url?: string): Observable<LoginResponse[]> {
    return of(null);
  }

  checkAuthIncludingServer(): Observable<boolean> {
    return of(null);
  }
}
