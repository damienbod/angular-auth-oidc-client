import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { DefaultSessionStorageService } from './../storage/default-sessionstorage.service';
import { AuthWellKnownService } from './auth-well-known/auth-well-known.service';
import { DEFAULT_CONFIG } from './default-config';
import { StsConfigLoader } from './loader/config-loader';
import { OpenIdConfiguration } from './openid-configuration';
import { ConfigValidationService } from './validation/config-validation.service';

@Injectable()
export class ConfigurationService {
  private configsInternal: Record<string, OpenIdConfiguration> = {};

  constructor(
    private loggerService: LoggerService,
    private publicEventsService: PublicEventsService,
    private authWellKnownService: AuthWellKnownService,
    private storagePersistenceService: StoragePersistenceService,
    private configValidationService: ConfigValidationService,
    private platformProvider: PlatformProvider,
    private defaultSessionStorageService: DefaultSessionStorageService,
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

    return this.loadConfigs().pipe(
      tap((allConfigs) => this.prepareAndSaveConfigs(allConfigs)),
      map(() => this.getConfig(configId))
    );
  }

  hasAtLeastOneConfig(): boolean {
    return Object.keys(this.configsInternal).length > 0;
  }

  private setConfig(readyConfig: OpenIdConfiguration): void {
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
    this.setConfig(usedConfig);

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

      return of(usedConfig);
    }

    return this.authWellKnownService.getAuthWellKnownEndPoints(usedConfig.authWellknownEndpointUrl, usedConfig).pipe(
      catchError((error) => {
        this.loggerService.logError(usedConfig, 'Getting auth well known endpoints failed on start', error);

        return throwError(() => new Error(error));
      }),
      tap((wellknownEndPoints) => {
        usedConfig.authWellknownEndpoints = wellknownEndPoints;
        this.publicEventsService.fireEvent<OpenIdConfiguration>(EventTypes.ConfigLoaded, usedConfig);
      }),
      switchMap(() => of(usedConfig))
    );
  }

  private prepareConfig(configuration: OpenIdConfiguration): OpenIdConfiguration {
    const openIdConfigurationInternal = { ...DEFAULT_CONFIG, ...configuration };
    this.setSpecialCases(openIdConfigurationInternal);
    this.setStorage(openIdConfigurationInternal);

    return openIdConfigurationInternal;
  }

  private setSpecialCases(currentConfig: OpenIdConfiguration): void {
    if (!this.platformProvider.isBrowser) {
      currentConfig.startCheckSession = false;
      currentConfig.silentRenew = false;
      currentConfig.useRefreshToken = false;
      currentConfig.usePushedAuthorisationRequests = false;
    }
  }

  private setStorage(currentConfig: OpenIdConfiguration): void {
    if (currentConfig.storage) {
      return;
    }

    if (this.hasBrowserStorage()) {
      currentConfig.storage = this.defaultSessionStorageService;
    } else {
      currentConfig.storage = null;
    }
  }

  private hasBrowserStorage(): boolean {
    return typeof navigator !== 'undefined' && navigator.cookieEnabled && typeof Storage !== 'undefined';
  }
}
