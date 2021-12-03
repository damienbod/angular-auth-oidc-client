import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../openid-configuration';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

export class AuthWellKnownServiceMock {
  getAuthWellKnownEndPoints(authWellknownEndpoint: string): Observable<AuthWellKnownEndpoints> {
    return of(null);
  }

  queryAndStoreAuthWellKnownEndPoints(config: OpenIdConfiguration) {}
}
