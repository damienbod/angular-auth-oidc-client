import { OpenIdConfiguration } from '../openid-configuration';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

export class AuthWellKnownServiceMock {
  getAuthWellKnownEndPoints(config: OpenIdConfiguration, mappedWellKnownEndpoints: AuthWellKnownEndpoints) {
    return null;
  }

  queryAndStoreAuthWellKnownEndPoints(config: OpenIdConfiguration) {}
}
