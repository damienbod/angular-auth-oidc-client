import { InjectionToken, Provider } from '@angular/core';
import {
  StsConfigLoader,
  StsConfigStaticLoader,
} from './config/loader/config-loader';
import { OpenIdConfiguration } from './config/openid-configuration';

export interface PassedInitialConfig {
  config?: OpenIdConfiguration | OpenIdConfiguration[];
  loader?: Provider;
}

export function createStaticLoader(
  passedConfig: PassedInitialConfig
): StsConfigLoader {
  if (!passedConfig?.config) {
    throw new Error('No config provided!');
  }

  return new StsConfigStaticLoader(passedConfig.config);
}

export const PASSED_CONFIG = new InjectionToken<PassedInitialConfig>(
  'PASSED_CONFIG'
);
