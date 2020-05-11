import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { OpenIdConfiguration } from './openid-configuration';

export interface PublicConfiguration {
    configuration: OpenIdConfiguration;
    wellknown: AuthWellKnownEndpoints;
}
