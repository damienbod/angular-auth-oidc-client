import { DEFAULT_CONFIG } from '../default-config';
import { OpenIdConfiguration } from '../openid-configuration';

export class ConfigurationProviderMock {
  private configInternal = null;

  getOpenIDConfiguration(): OpenIdConfiguration {
    return this.configInternal || DEFAULT_CONFIG;
  }

  hasConfig() {
    return true;
  }

  setConfig(configuration: OpenIdConfiguration) {
    this.configInternal = configuration;
  }
}
