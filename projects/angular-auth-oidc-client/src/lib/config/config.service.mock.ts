import { Observable } from 'rxjs';
import { OpenIdConfiguration } from './openid-configuration';

export class ConfigurationServiceMock {
  hasManyConfigs(): boolean {
    return null;
  }

  getAllConfigurations(): OpenIdConfiguration[] {
    return null;
  }

  getOpenIDConfiguration(configId?: string): Observable<OpenIdConfiguration> {
    return null;
  }

  getOpenIDConfigurations(configId?: string): Observable<{ allConfigs; currentConfig }> {
    return null;
  }

  hasAtLeastOneConfig(): boolean {
    return null;
  }
}
