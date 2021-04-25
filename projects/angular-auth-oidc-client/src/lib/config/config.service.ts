import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigValidationService } from '../config-validation/config-validation.service';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { AuthWellKnownService } from './auth-well-known.service';
import { ConfigurationProvider } from './config.provider';
import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';
import { PublicConfiguration } from './public-configuration';

@Injectable()
export class OidcConfigService {
  constructor(
    private loggerService: LoggerService,
    private publicEventsService: PublicEventsService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService,
    private storagePersistenceService: StoragePersistenceService,
    private configValidationService: ConfigValidationService,
    private platformProvider: PlatformProvider
  ) {}

  withConfig(passedConfig: OpenIdConfiguration, passedAuthWellKnownEndpoints?: AuthWellKnownEndpoints): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.configValidationService.validateConfig(passedConfig)) {
        this.loggerService.logError('Validation of config rejected with errors. Config is NOT set.');
        resolve(null);
      }

      if (!passedConfig.authWellknownEndpoint) {
        passedConfig.authWellknownEndpoint = passedConfig.stsServer;
      }

      const usedConfig = this.prepareConfig(passedConfig);
      this.configurationProvider.setConfig(usedConfig);

      const alreadyExistingAuthWellKnownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints');
      if (!!alreadyExistingAuthWellKnownEndpoints) {
        this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
          configuration: usedConfig,
          wellknown: alreadyExistingAuthWellKnownEndpoints,
        });

        resolve(usedConfig);
      }

      if (!!passedAuthWellKnownEndpoints) {
        this.authWellKnownService.storeWellKnownEndpoints(passedAuthWellKnownEndpoints);
        this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
          configuration: usedConfig,
          wellknown: passedAuthWellKnownEndpoints,
        });

        resolve(usedConfig);
      }

      if (usedConfig.eagerLoadAuthWellKnownEndpoints) {
        this.authWellKnownService
          .getAuthWellKnownEndPoints(usedConfig.authWellknownEndpoint)
          .pipe(
            catchError((error) => {
              this.loggerService.logError('Getting auth well known endpoints failed on start', error);
              return throwError(error);
            }),
            tap((wellknownEndPoints) =>
              this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
                configuration: usedConfig,
                wellknown: wellknownEndPoints,
              })
            )
          )
          .subscribe(
            () => resolve(usedConfig),
            () => reject()
          );
      } else {
        this.publicEventsService.fireEvent<PublicConfiguration>(EventTypes.ConfigLoaded, {
          configuration: passedConfig,
          wellknown: null,
        });
        resolve(usedConfig);
      }
    });
  }

  private prepareConfig(configuration: OpenIdConfiguration) {
    const openIdConfigurationInternal = { ...DEFAULT_CONFIG, ...configuration };
    this.setSpecialCases(openIdConfigurationInternal);

    return openIdConfigurationInternal;
  }

  private setSpecialCases(currentConfig: OpenIdConfiguration) {
    if (!this.platformProvider.isBrowser) {
      currentConfig.startCheckSession = false;
      currentConfig.silentRenew = false;
      currentConfig.useRefreshToken = false;
      currentConfig.usePushedAuthorisationRequests = false;
    }
  }
}
