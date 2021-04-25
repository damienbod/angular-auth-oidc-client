import { StsConfigLoader } from './config-loader';
import { DEFAULT_CONFIG } from './default-config';

export class StsConfigLoaderMock implements StsConfigLoader {
  loadConfig(): Promise<any> {
    return new Promise((resolve, reject) => resolve(DEFAULT_CONFIG));
  }
}
