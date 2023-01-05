import { makeEnvironmentProviders, Provider } from '@angular/core';
import { createStaticLoader, PassedInitialConfig, PASSED_CONFIG } from './auth-config';
import { StsConfigLoader } from './config/loader/config-loader';
import { AbstractLoggerService } from './logging/abstract-logger.service';
import { ConsoleLoggerService } from './logging/console-logger.service';
import { AbstractSecurityStorage } from './storage/abstract-security-storage';
import { DefaultSessionStorageService } from './storage/default-sessionstorage.service';

// this type can be dropped when Angular 14 support is dropped (and imported from angular/core)
declare type EnvironmentProviders = {
  ɵbrand: 'EnvironmentProviders';
};

export function provideAuth(passedConfig: PassedInitialConfig): EnvironmentProviders {
  return makeEnvironmentProviders([..._provideAuth(passedConfig)]);
}

export function _provideAuth(passedConfig: PassedInitialConfig): Provider[] {
  return [
    // Make the PASSED_CONFIG available through injection
    { provide: PASSED_CONFIG, useValue: passedConfig },

    // Create the loader: Either the one getting passed or a static one
    passedConfig?.loader || { provide: StsConfigLoader, useFactory: createStaticLoader, deps: [PASSED_CONFIG] },
    { provide: AbstractSecurityStorage, useClass: DefaultSessionStorageService },
    { provide: AbstractLoggerService, useClass: ConsoleLoggerService },
  ];
}
