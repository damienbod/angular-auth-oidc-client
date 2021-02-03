import { Injectable } from '@angular/core';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

@Injectable()
export class AuthWellKnownServiceMock {
  getAuthWellKnownEndPoints(authWellknownEndpoint: string) {
    return null;
  }

  storeWellKnownEndpoints(mappedWellKnownEndpoints: AuthWellKnownEndpoints) {}
}
