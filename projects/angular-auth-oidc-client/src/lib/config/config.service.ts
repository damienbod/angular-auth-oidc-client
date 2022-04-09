import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { AbstractLoggerService } from '../logging/abstract-logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownService } from './auth-well-known/auth-well-known.service';
import { DEFAULT_CONFIG } from './default-config';
import { StsConfigLoader } from './loader/config-loader';
import { OpenIdConfiguration } from './openid-configuration';
import { ConfigValidationService } from './validation/config-validation.service';

@Injectable()
export class ConfigurationService {
  private configsInternal: Record<string, OpenIdConfiguration> = {};

  constructor(
    private loggerService: AbstractLoggerService,
    private publicEventsService: PublicEventsService,
    private storagePersistenceService: StoragePersistenceService,
    private configValidationService: ConfigValidationService,
    private platformProvider: PlatformProvider,
    private authWellKnownService: AuthWellKnownService,
    private loader: StsConfigLoader
  ) {}

  hasManyConfigs(): boolean {
    return Object.keys(this.configsInternal).length > 1;
  }

  getAllConfigurations(): OpenIdConfiguration[] {
    return Object.values(this.configsInternal);
  }

  getOpenIDConfiguration(configId?: string): Observable<OpenIdConfiguration> {
    if (this.configsAlreadySaved()) {
      return of(this.getConfig(configId));
    }

    return this.getOpenIDConfigurations(configId).pipe(map((result) => result.currentConfig));
  }

  getOpenIDConfigurations(configId?: string): Observable<{ allConfigs; currentConfig }> {
    return this.loadConfigs().pipe(
      concatMap((allConfigs) => this.prepareAndSaveConfigs(allConfigs)),
      map((allPreparedConfigs) => ({
        allConfigs: allPreparedConfigs,
        currentConfig: this.getConfig(configId),
      }))
    );
  }

  hasAtLeastOneConfig(): boolean {
    return Object.keys(this.configsInternal).length > 0;
  }

  private saveConfig(readyConfig: OpenIdConfiguration): void {
    const { configId } = readyConfig;
    this.configsInternal[configId] = readyConfig;
  }

  private loadConfigs(): Observable<OpenIdConfiguration[]> {
    return forkJoin(this.loader.loadConfigs());
  }

  private configsAlreadySaved(): boolean {
    return this.hasAtLeastOneConfig();
  }

  private getConfig(configId: string): OpenIdConfiguration {
    if (!!configId) {
      return this.configsInternal[configId] || null;
    }

    const [, value] = Object.entries(this.configsInternal)[0] || [[null, null]];

    return value || null;
  }

  private prepareAndSaveConfigs(passedConfigs: OpenIdConfiguration[]): Observable<OpenIdConfiguration[]> {
    if (!this.configValidationService.validateConfigs(passedConfigs)) {
      return of(null);
    }

    this.createUniqueIds(passedConfigs);
    const allHandleConfigs$ = passedConfigs.map((x) => this.handleConfig(x));

    return forkJoin(allHandleConfigs$);
  }

  private createUniqueIds(passedConfigs: OpenIdConfiguration[]): void {
    passedConfigs.forEach((config, index) => {
      if (!config.configId) {
        config.configId = `${index}-${config.clientId}`;
      }
    });
  }

  private handleConfig(passedConfig: OpenIdConfiguration): Observable<OpenIdConfiguration> {
    if (!this.configValidationService.validateConfig(passedConfig)) {
      this.loggerService.logError(passedConfig, 'Validation of config rejected with errors. Config is NOT set.');

      return of(null);
    }

    if (!passedConfig.authWellknownEndpointUrl) {
      passedConfig.authWellknownEndpointUrl = passedConfig.authority;
    }

    const usedConfig = this.prepareConfig(passedConfig);
    this.saveConfig(usedConfig);

    const alreadyExistingAuthWellKnownEndpoints = this.storagePersistenceService.read('authWellKnownEndPoints', usedConfig);
    if (!!alreadyExistingAuthWellKnownEndpoints) {
      usedConfig.authWellknownEndpoints = alreadyExistingAuthWellKnownEndpoints;
      this.publicEventsService.fireEvent<OpenIdConfiguration>(EventTypes.ConfigLoaded, usedConfig);

      return of(usedConfig);
    }

    const passedAuthWellKnownEndpoints = usedConfig.authWellknownEndpoints;

    if (!!passedAuthWellKnownEndpoints) {
      this.authWellKnownService.storeWellKnownEndpoints(usedConfig, passedAuthWellKnownEndpoints);
      usedConfig.authWellknownEndpoints = passedAuthWellKnownEndpoints;
      this.publicEventsService.fireEvent<OpenIdConfiguration>(EventTypes.ConfigLoaded, usedConfig);
    }

    return of(usedConfig);
  }

  private prepareConfig(configuration: OpenIdConfiguration): OpenIdConfiguration {
    const openIdConfigurationInternal = { ...DEFAULT_CONFIG, ...configuration };
    this.setSpecialCases(openIdConfigurationInternal);

    return openIdConfigurationInternal;
  }

  private setSpecialCases(currentConfig: OpenIdConfiguration): void {
    if (!this.platformProvider.isBrowser()) {
      currentConfig.startCheckSession = false;
      currentConfig.silentRenew = false;
      currentConfig.useRefreshToken = false;
      currentConfig.usePushedAuthorisationRequests = false;
    }
  }

  private hasBrowserStorage(): boolean {
    return typeof navigator !== 'undefined' && navigator.cookieEnabled && typeof Storage !== 'undefined';
  }
}
