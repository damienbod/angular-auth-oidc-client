import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable()
export class ConfigurationProvider {
  private openIdConfigurationInternal: OpenIdConfiguration;

  hasValidConfig() {
    return !!this.openIdConfigurationInternal;
  }

  setOpenIDConfiguration(readyConfig: OpenIdConfiguration) {
    this.openIdConfigurationInternal = readyConfig;
  }

  getOpenIDConfiguration(): OpenIdConfiguration {
    return this.openIdConfigurationInternal || null;
  }
}
