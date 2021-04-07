import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';
import { PublicConfiguration } from './public-configuration';

export class ConfigurationProviderMock {
  getOpenIDConfiguration(): OpenIdConfiguration {
    return DEFAULT_CONFIG;
  }

  get configuration(): PublicConfiguration {
    return null;
  }

  hasValidConfig() {
    return true;
  }

  setConfig(configuration: OpenIdConfiguration) {}
}
