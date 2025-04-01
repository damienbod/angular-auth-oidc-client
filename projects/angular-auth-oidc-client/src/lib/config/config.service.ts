import { inject, Injectable, isDevMode } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownService } from './auth-well-known/auth-well-known.service';
import { DEFAULT_CONFIG } from './default-config';
import { StsConfigLoader } from './loader/config-loader';
import { OpenIdConfiguration } from './openid-configuration';
import { ConfigValidationService } from './validation/config-validation.service';

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private configsInternal: Record<string, OpenIdConfiguration> = {};

  private readonly loggerService = inject(LoggerService);
  private readonly publicEventsService = inject(PublicEventsService);
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly platformProvider = inject(PlatformProvider);
  private readonly authWellKnownService = inject(AuthWellKnownService);
  private readonly loader = inject(StsConfigLoader);
  private readonly configValidationService = inject(ConfigValidationService);

  hasManyConfigs(): boolean {
    return Object.keys(this.configsInternal).length > 1;
  }

  getAllConfigurations(): OpenIdConfiguration[] {
    return Object.values(this.configsInternal);
  }

  getOpenIDConfiguration(
    configId?: string
  ): Observable<OpenIdConfiguration | null> {
    if (this.configsAlreadySaved()) {
      return of(this.getConfig(configId));
    }

    return this.getOpenIDConfigurations(configId).pipe(
      map((result) => result.currentConfig)
    );
  }

  getOpenIDConfigurations(configId?: string): Observable<{
    allConfigs: OpenIdConfiguration[];
    currentConfig: OpenIdConfiguration | null;
  }> {
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

    this.configsInternal[configId as string] = readyConfig;
  }

  private loadConfigs(): Observable<OpenIdConfiguration[]> {
    return this.loader.loadConfigs();
  }

  private configsAlreadySaved(): boolean {
    return this.hasAtLeastOneConfig();
  }

  private getConfig(configId?: string): OpenIdConfiguration | null {
    if (Boolean(configId)) {
      const config = this.configsInternal[configId!];

      if (!config && isDevMode()) {
        console.warn(
          `[angular-auth-oidc-client] No configuration found for config id '${configId}'.`
        );
      }

      return config || null;
    }

    const [, value] = Object.entries(this.configsInternal)[0] || [[null, null]];

    return value || null;
  }

  private prepareAndSaveConfigs(
    passedConfigs: OpenIdConfiguration[]
  ): Observable<OpenIdConfiguration[]> {
    if (!this.configValidationService.validateConfigs(passedConfigs)) {
      return of([]);
    }

    this.createUniqueIds(passedConfigs);

    const allHandleConfigs$ = passedConfigs.map((x) => this.handleConfig(x));

    return forkJoin(allHandleConfigs$).pipe(
      map((config) => config.filter((conf) => Boolean(conf))),
      map((c) => c as OpenIdConfiguration[])
    );
  }

  private createUniqueIds(passedConfigs: OpenIdConfiguration[]): void {
    passedConfigs.forEach((config, index) => {
      if (!config.configId) {
        config.configId = `${index}-${config.clientId}`;
      }
    });
  }

  private handleConfig(
    passedConfig: OpenIdConfiguration
  ): Observable<OpenIdConfiguration | null> {
    if (!this.configValidationService.validateConfig(passedConfig)) {
      this.loggerService.logError(
        passedConfig,
        'Validation of config rejected with errors. Config is NOT set.'
      );

      return of(null);
    }

    if (!passedConfig.authWellknownEndpointUrl) {
      passedConfig.authWellknownEndpointUrl = passedConfig.authority;
    }

    const usedConfig = this.prepareConfig(passedConfig);

    this.saveConfig(usedConfig);

    const configWithAuthWellKnown =
      this.enhanceConfigWithWellKnownEndpoint(usedConfig);

    this.publicEventsService.fireEvent<OpenIdConfiguration>(
      EventTypes.ConfigLoaded,
      configWithAuthWellKnown
    );

    return of(usedConfig);
  }

  private enhanceConfigWithWellKnownEndpoint(
    configuration: OpenIdConfiguration
  ): OpenIdConfiguration {
    const alreadyExistingAuthWellKnownEndpoints =
      this.storagePersistenceService.read(
        'authWellKnownEndPoints',
        configuration
      );

    if (!!alreadyExistingAuthWellKnownEndpoints) {
      configuration.authWellknownEndpoints =
        alreadyExistingAuthWellKnownEndpoints;

      return configuration;
    }

    const passedAuthWellKnownEndpoints = configuration.authWellknownEndpoints;

    if (!!passedAuthWellKnownEndpoints) {
      this.authWellKnownService.storeWellKnownEndpoints(
        configuration,
        passedAuthWellKnownEndpoints
      );
      configuration.authWellknownEndpoints = passedAuthWellKnownEndpoints;

      return configuration;
    }

    return configuration;
  }

  private prepareConfig(
    configuration: OpenIdConfiguration
  ): OpenIdConfiguration {
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
}
