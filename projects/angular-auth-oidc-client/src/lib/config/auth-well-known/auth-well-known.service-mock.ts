import { OpenIdConfiguration } from '../openid-configuration';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

export class AuthWellKnownServiceMock {
  storeWellKnownEndpoints(config: OpenIdConfiguration, mappedWellKnownEndpoints: AuthWellKnownEndpoints): void {}

  queryAndStoreAuthWellKnownEndPoints(config: OpenIdConfiguration) {}
}
