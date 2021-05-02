import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable()
export class ConfigurationProvider {
  private configsInternal: Record<string, OpenIdConfiguration> = {};

  hasValidConfig(): boolean {
    return Object.keys(this.configsInternal).length > 0;
  }

  setConfig(readyConfig: OpenIdConfiguration): void {
    const { uniqueId } = readyConfig;
    this.configsInternal[uniqueId] = readyConfig;
  }

  getOpenIDConfiguration(uniqueId?: string): OpenIdConfiguration {
    if (!!uniqueId) {
      return this.configsInternal[uniqueId] || null;
    }

    const [, value] = Object.entries(this.configsInternal)[0];

    return value || null;
  }
}
