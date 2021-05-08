import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable()
export class ConfigurationProvider {
  private configsInternal: Record<string, OpenIdConfiguration> = {};

  hasConfig(): boolean {
    return Object.keys(this.configsInternal).length > 0;
  }

  hasManyConfigs(): boolean {
    return Object.keys(this.configsInternal).length > 1;
  }

  setConfig(readyConfig: OpenIdConfiguration): void {
    const { configId } = readyConfig;
    this.configsInternal[configId] = readyConfig;
  }

  getOpenIDConfiguration(configId?: string, url?: string): OpenIdConfiguration {
    if (!!configId) {
      return this.configsInternal[configId] || null;
    }

    const [, value] = Object.entries(this.configsInternal)[0];

    return value || null;
  }

  getAllConfigurations(): OpenIdConfiguration[] {
    return Object.values(this.configsInternal);
  }
}
