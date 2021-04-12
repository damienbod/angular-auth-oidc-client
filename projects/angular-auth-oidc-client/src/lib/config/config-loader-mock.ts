import { StsConfigLoader } from './config-loader';

export class StsConfigLoaderMock implements StsConfigLoader {
  loadConfig(): Promise<any> {
    return new Promise((resolve, reject) => resolve(null));
  }
}
