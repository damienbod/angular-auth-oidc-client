import { Provider } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';

export interface PassedInitialConfig {
  config?: OpenIdConfiguration | OpenIdConfiguration[];
  loader?: Provider;
  storage?: any;
}
