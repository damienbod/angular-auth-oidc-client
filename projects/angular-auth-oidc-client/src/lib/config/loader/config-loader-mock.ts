import { DEFAULT_CONFIG } from '../default-config';
import { OpenIdConfiguration } from '../openid-configuration';
import { StsConfigLoader } from './config-loader';

export class StsConfigLoaderMock implements StsConfigLoader {
  loadConfigs(): Promise<OpenIdConfiguration>[] {
    return [new Promise((resolve, reject) => resolve(DEFAULT_CONFIG))];
  }
}
