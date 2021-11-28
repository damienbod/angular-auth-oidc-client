import { OpenIdConfiguration } from '../config/openid-configuration';

export class ResetAuthDataServiceMock {
  resetAuthorizationData(currentConfiguration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {}
}
