import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { mockAbstractProvider, mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/services/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownService } from './auth-well-known/auth-well-known.service';
import { ConfigurationService } from './config.service';
import { StsConfigLoader, StsConfigStaticLoader } from './loader/config-loader';
import { OpenIdConfiguration } from './openid-configuration';
import { ConfigValidationService } from './validation/config-validation.service';

describe('Configuration Service', () => {
  let configService: ConfigurationService;
  let publicEventsService: PublicEventsService;
  let authWellKnownService: AuthWellKnownService;
  let storagePersistenceService: StoragePersistenceService;
  let configValidationService: ConfigValidationService;
  let platformProvider: PlatformProvider;
  let stsConfigLoader: StsConfigLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigurationService,
        mockProvider(LoggerService),
        PublicEventsService,
        mockProvider(StoragePersistenceService),
        ConfigValidationService,
        mockProvider(PlatformProvider),
        mockProvider(AuthWellKnownService),
        mockAbstractProvider(StsConfigLoader, StsConfigStaticLoader),
      ],
    });
  });

  beforeEach(() => {
    configService = TestBed.inject(ConfigurationService);
    publicEventsService = TestBed.inject(PublicEventsService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    stsConfigLoader = TestBed.inject(StsConfigLoader);
    platformProvider = TestBed.inject(PlatformProvider);
    configValidationService = TestBed.inject(ConfigValidationService);
  });

  async function storeConfigs(configs: OpenIdConfiguration[]): Promise<void> {
    vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(of(configs));
    vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);

    await firstValueFrom(configService.getOpenIDConfigurations());
  }

  it('should create', () => {
    expect(configService).toBeTruthy();
  });

  describe('hasManyConfigs', () => {
    it('should return true if many configs are stored', async () => {
      await storeConfigs([
        { configId: 'configId1' },
        { configId: 'configId2' },
      ]);

      const result = configService.hasManyConfigs();

      expect(result).toBe(true);
    });

    it('should return false if only one config is stored', async () => {
      await storeConfigs([{ configId: 'configId1' }]);

      const result = configService.hasManyConfigs();

      expect(result).toBe(false);
    });
  });

  describe('getAllConfigurations', () => {
    it('should return all configs as array', async () => {
      await storeConfigs([
        { configId: 'configId1' },
        { configId: 'configId2' },
      ]);

      const result = configService.getAllConfigurations();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getOpenIDConfiguration', () => {
    it(`should not call loadConfigs if the config is already saved`, async () => {
      await storeConfigs([
        { configId: 'configId1' },
        { configId: 'configId2' },
      ]);
      const spy = vi.spyOn(stsConfigLoader, 'loadConfigs');

      spy.mockClear();
      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toBeTruthy();
      expect(spy).not.toHaveBeenCalled();
    });

    it(`should call loadConfigs if the config is not already saved`, async () => {
      const configs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const spy = vi
        .spyOn(stsConfigLoader, 'loadConfigs')
        .mockReturnValue(of(configs));

      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);

      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toBeTruthy();
      expect(spy).toHaveBeenCalled();
    });

    it(`should return null if config is not valid`, async () => {
      const configs = [{ configId: 'configId1' }];

      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(of(configs));
      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(
        false
      );
      const consoleSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toBeNull();
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        `[angular-auth-oidc-client] No configuration found for config id 'configId1'.`
      );
    });

    it(`should return null if configs are stored but not existing ID is passed`, async () => {
      await storeConfigs([
        { configId: 'configId1' },
        { configId: 'configId2' },
      ]);

      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('notExisting')
      );

      expect(config).toBeNull();
    });

    it(`should set authWellKnownEndPoints on config if authWellKnownEndPoints is stored`, async () => {
      const configs = [{ configId: 'configId1' }];

      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(of(configs));
      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);
      const consoleSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        issuer: 'auth-well-known',
      });

      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config?.authWellknownEndpoints).toEqual({
        issuer: 'auth-well-known',
      });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it(`should fire ConfigLoaded if authWellKnownEndPoints is stored`, async () => {
      const configs = [{ configId: 'configId1' }];

      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(of(configs));
      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        issuer: 'auth-well-known',
      });

      const spy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      await firstValueFrom(configService.getOpenIDConfiguration('configId1'));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        EventTypes.ConfigLoaded,
        expect.anything()
      );
    });

    it(`should store, use and fire an event when auth well-known endpoints are passed`, async () => {
      const configs = [
        {
          configId: 'configId1',
          authWellknownEndpoints: { issuer: 'auth-well-known' },
        },
      ];

      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(of(configs));
      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(null);

      const fireEventSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);
      const storeWellKnownEndpointsSpy = vi
        .spyOn(authWellKnownService, 'storeWellKnownEndpoints')
        .mockReturnValue(undefined);
      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toBeTruthy();
      expect(fireEventSpy).toHaveBeenCalledTimes(1);
      expect(fireEventSpy).toHaveBeenCalledWith(
        EventTypes.ConfigLoaded,
        expect.anything()
      );
      expect(storeWellKnownEndpointsSpy).toHaveBeenCalledTimes(1);
      expect(storeWellKnownEndpointsSpy).toHaveBeenCalledWith(
        config as OpenIdConfiguration,
        {
          issuer: 'auth-well-known',
        }
      );
    });
  });

  describe('getOpenIDConfigurations', () => {
    it(`should return correct result`, async () => {
      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(
        of([
          { configId: 'configId1' } as OpenIdConfiguration,
          { configId: 'configId2' } as OpenIdConfiguration,
        ])
      );

      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);

      const result = await firstValueFrom(
        configService.getOpenIDConfigurations('configId1')
      );

      expect(result.allConfigs.length).toEqual(2);
      expect(result.currentConfig).toBeTruthy();
    });

    it(`should create a configId when configId is not set`, async () => {
      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(
        of([
          { clientId: 'clientId1' } as OpenIdConfiguration,
          { clientId: 'clientId2' } as OpenIdConfiguration,
        ])
      );

      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);

      const result = await firstValueFrom(
        configService.getOpenIDConfigurations()
      );

      expect(result.allConfigs.length).toEqual(2);
      const allConfigIds = result.allConfigs.map((x) => x.configId);

      expect(allConfigIds).toEqual(['0-clientId1', '1-clientId2']);

      expect(result.currentConfig).toBeTruthy();
      expect(result.currentConfig?.configId).toBeTruthy();
    });

    it(`should return empty array if config is not valid`, async () => {
      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(
        of([
          { configId: 'configId1' } as OpenIdConfiguration,
          { configId: 'configId2' } as OpenIdConfiguration,
        ])
      );

      vi.spyOn(configValidationService, 'validateConfigs').mockReturnValue(
        false
      );

      const { allConfigs, currentConfig } = await firstValueFrom(
        configService.getOpenIDConfigurations()
      );

      expect(allConfigs).toEqual([]);
      expect(currentConfig).toBeNull();
    });
  });

  describe('platform special cases', () => {
    it(`should disable browser-only features when current platform is NOT browser`, async () => {
      vi.spyOn(platformProvider, 'isBrowser').mockReturnValue(false);
      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(
        of([
          {
            configId: 'configId1',
            startCheckSession: true,
            silentRenew: true,
            useRefreshToken: true,
            usePushedAuthorisationRequests: true,
          },
        ])
      );
      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);

      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toEqual(
        expect.objectContaining({
          configId: 'configId1',
          startCheckSession: false,
          silentRenew: false,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
        })
      );
    });

    it(`should keep browser-only features when current platform is browser`, async () => {
      vi.spyOn(platformProvider, 'isBrowser').mockReturnValue(true);
      vi.spyOn(stsConfigLoader, 'loadConfigs').mockReturnValue(
        of([
          {
            configId: 'configId1',
            startCheckSession: true,
            silentRenew: true,
            useRefreshToken: true,
            usePushedAuthorisationRequests: true,
          },
        ])
      );
      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);

      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toEqual(
        expect.objectContaining({
          startCheckSession: true,
          silentRenew: true,
          useRefreshToken: true,
          usePushedAuthorisationRequests: true,
        })
      );
    });
  });
});
