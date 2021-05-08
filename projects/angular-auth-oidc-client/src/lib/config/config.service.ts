import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigValidationService } from '../config-validation/config-validation.service';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownService } from './auth-well-known.service';
import { ConfigurationProvider } from './config.provider';
import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';

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

  withConfigs(passedConfigs: OpenIdConfiguration[]): Promise<any> {
    this.createUniqueIds(passedConfigs);
    const allHandleConfigPromises = passedConfigs.map((x) => this.handleConfig(x));

    return Promise.all(allHandleConfigPromises);
  }

  private createUniqueIds(passedConfigs: OpenIdConfiguration[]) {
    passedConfigs.forEach((config, index) => {
      if (!config.configId) {
        config.configId = `${index}-${config.clientId}`;
      }
    });
  }

  private handleConfig(passedConfig: OpenIdConfiguration): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.configValidationService.validateConfig(passedConfig)) {
        this.loggerService.logError(passedConfig.configId, 'Validation of config rejected with errors. Config is NOT set.');
        resolve(null);
        return;
      }

      if (!passedConfig.authWellknownEndpoint) {
        passedConfig.authWellknownEndpoint = passedConfig.stsServer;
      }

      const usedConfig = this.prepareConfig(passedConfig);
      this.configurationProvider.setConfig(usedConfig);

      const alreadyExistingAuthWellKnownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints', usedConfig.configId);
      if (!!alreadyExistingAuthWellKnownEndpoints) {
        usedConfig.authWellKnown = alreadyExistingAuthWellKnownEndpoints;
        this.publicEventsService.fireEvent<OpenIdConfiguration>(EventTypes.ConfigLoaded, usedConfig);

        resolve(usedConfig);
        return;
      }

      const passedAuthWellKnownEndpoints = usedConfig.authWellKnown;

      if (!!passedAuthWellKnownEndpoints) {
        this.authWellKnownService.storeWellKnownEndpoints(usedConfig.configId, passedAuthWellKnownEndpoints);
        usedConfig.authWellKnown = alreadyExistingAuthWellKnownEndpoints;
        this.publicEventsService.fireEvent<OpenIdConfiguration>(EventTypes.ConfigLoaded, usedConfig);

        resolve(usedConfig);
        return;
      }

      if (usedConfig.eagerLoadAuthWellKnownEndpoints) {
        this.authWellKnownService
          .getAuthWellKnownEndPoints(usedConfig.authWellknownEndpoint, usedConfig.configId)
          .pipe(
            catchError((error) => {
              this.loggerService.logError('Getting auth well known endpoints failed on start', error);
              return throwError(error);
            }),
            tap((wellknownEndPoints) => {
              usedConfig.authWellKnown = wellknownEndPoints;
              this.publicEventsService.fireEvent<OpenIdConfiguration>(EventTypes.ConfigLoaded, usedConfig);
            })
          )
          .subscribe(
            () => resolve(usedConfig),
            () => reject()
          );
      } else {
        this.publicEventsService.fireEvent<OpenIdConfiguration>(EventTypes.ConfigLoaded, usedConfig);
        resolve(usedConfig);
        return;
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
