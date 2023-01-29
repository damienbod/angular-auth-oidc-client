import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { InjectionToken, ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { StsConfigLoader, StsConfigStaticLoader } from './config/loader/config-loader';
import { OpenIdConfiguration } from './config/openid-configuration';
import { AbstractLoggerService } from './logging/abstract-logger.service';
import { ConsoleLoggerService } from './logging/console-logger.service';
import { AbstractSecurityStorage } from './storage/abstract-security-storage';
import { DefaultSessionStorageService } from './storage/default-sessionstorage.service';

export interface PassedInitialConfig {
  config?: OpenIdConfiguration | OpenIdConfiguration[];
  loader?: Provider;
  storage?: any;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createStaticLoader(passedConfig: PassedInitialConfig) {
  return new StsConfigStaticLoader(passedConfig.config);
}

export const PASSED_CONFIG = new InjectionToken<PassedInitialConfig>('PASSED_CONFIG');

@NgModule({
  imports: [CommonModule, HttpClientModule],
  declarations: [],
  exports: [],
})
export class AuthModule {
  static forRoot(passedConfig: PassedInitialConfig): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
        // Make the PASSED_CONFIG available through injection
        { provide: PASSED_CONFIG, useValue: passedConfig },

        // Create the loader: Either the one getting passed or a static one
        passedConfig?.loader || { provide: StsConfigLoader, useFactory: createStaticLoader, deps: [PASSED_CONFIG] },
        { provide: AbstractSecurityStorage, useClass: DefaultSessionStorageService },
        { provide: AbstractLoggerService, useClass: ConsoleLoggerService },
      ],
    };
  }
}
