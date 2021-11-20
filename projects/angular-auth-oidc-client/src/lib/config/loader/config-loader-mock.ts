import { Observable, of } from 'rxjs';
import { DEFAULT_CONFIG } from '../default-config';
import { OpenIdConfiguration } from '../openid-configuration';
import { StsConfigLoader } from './config-loader';

export class StsConfigLoaderMock implements StsConfigLoader {
  loadConfigs(): Observable<OpenIdConfiguration>[] {
    return [of(DEFAULT_CONFIG)];
  }
}
