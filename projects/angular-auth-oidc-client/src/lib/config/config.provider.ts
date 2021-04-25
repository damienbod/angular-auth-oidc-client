import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable()
export class ConfigurationProvider {
  private openIdConfigurationInternal: OpenIdConfiguration;

  hasValidConfig() {
    return !!this.openIdConfigurationInternal;
  }

  setConfig(readyConfig: OpenIdConfiguration) {
    this.openIdConfigurationInternal = readyConfig;

    return this.openIdConfigurationInternal;
  }

  getOpenIDConfiguration(): OpenIdConfiguration {
    return this.openIdConfigurationInternal || null;
  }
}
