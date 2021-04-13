import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';

export class ConfigurationProviderMock {
  private configInternal = null;

  getOpenIDConfiguration(): OpenIdConfiguration {
    return this.configInternal || DEFAULT_CONFIG;
  }

  hasValidConfig() {
    return true;
  }

  setConfig(configuration: OpenIdConfiguration) {
    this.configInternal = configuration;
  }
}
