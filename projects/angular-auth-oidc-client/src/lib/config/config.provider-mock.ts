import { OpenIdConfiguration } from './openid-configuration';
import { PublicConfiguration } from './public-configuration';

export class ConfigurationProviderMock {
  get openIDConfiguration(): OpenIdConfiguration {
    return null;
  }

  get configuration(): PublicConfiguration {
    return null;
  }

  hasValidConfig() {
    return true;
  }

  setConfig(configuration: OpenIdConfiguration) {}
}
