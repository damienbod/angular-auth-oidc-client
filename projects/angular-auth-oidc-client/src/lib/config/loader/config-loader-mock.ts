import { DEFAULT_CONFIG } from '../default-config';
import { StsConfigLoader } from './config-loader';

export class StsConfigLoaderMock implements StsConfigLoader {
  loadConfig(): Promise<any> {
    return new Promise((resolve, reject) => resolve(DEFAULT_CONFIG));
  }
}
