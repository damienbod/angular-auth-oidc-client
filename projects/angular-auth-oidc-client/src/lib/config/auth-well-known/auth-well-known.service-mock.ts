import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

@Injectable()
export class AuthWellKnownServiceMock {
  getAuthWellKnownEndPoints(authWellknownEndpoint: string): Observable<AuthWellKnownEndpoints> {
    return of(null);
  }

  storeWellKnownEndpoints(mappedWellKnownEndpoints: AuthWellKnownEndpoints) {}
}
