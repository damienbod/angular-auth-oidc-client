import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { mockAbstractProvider, mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
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

  it('should create', () => {
    expect(configService).toBeTruthy();
  });

  describe('hasManyConfigs', () => {
    it('returns true if many configs are stored', () => {
      (configService as any).configsInternal = {
        configId1: { configId: 'configId1' },
        configId2: { configId: 'configId2' },
      };

      const result = configService.hasManyConfigs();

      expect(result).toBe(true);
    });

    it('returns false if only one config is stored', () => {
      (configService as any).configsInternal = {
        configId1: { configId: 'configId1' },
      };

      const result = configService.hasManyConfigs();

      expect(result).toBe(false);
    });
  });

  describe('getAllConfigurations', () => {
    it('returns all configs as array', () => {
      (configService as any).configsInternal = {
        configId1: { configId: 'configId1' },
        configId2: { configId: 'configId2' },
      };

      const result = configService.getAllConfigurations();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getOpenIDConfiguration', () => {
    it(`if config is already saved 'loadConfigs' is not called`, async () => {
      (configService as any).configsInternal = {
        configId1: { configId: 'configId1' },
        configId2: { configId: 'configId2' },
      };
      const spy = vi
        .spyOn(configService as any, 'loadConfigs')
        .mockReturnValue(undefined);
      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toBeTruthy();
      expect(spy).not.toHaveBeenCalled();
    });

    it(`if config is NOT already saved 'loadConfigs' is called`, async () => {
      const configs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const spy = vi
        .spyOn(configService as any, 'loadConfigs')
        .mockReturnValue(of(configs));

      vi.spyOn(configValidationService, 'validateConfig').mockReturnValue(true);

      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('configId1')
      );

      expect(config).toBeTruthy();
      expect(spy).toHaveBeenCalled();
    });

    it(`returns null if config is not valid`, async () => {
      const configs = [{ configId: 'configId1' }];

      vi.spyOn(configService as any, 'loadConfigs').mockReturnValue(
        of(configs)
      );
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

    it(`returns null if configs are stored but not existing ID is passed`, async () => {
      (configService as any).configsInternal = {
        configId1: { configId: 'configId1' },
        configId2: { configId: 'configId2' },
      };

      const config = await firstValueFrom(
        configService.getOpenIDConfiguration('notExisting')
      );

      expect(config).toBeNull();
    });

    it(`sets authWellKnownEndPoints on config if authWellKnownEndPoints is stored`, async () => {
      const configs = [{ configId: 'configId1' }];

      vi.spyOn(configService as any, 'loadConfigs').mockReturnValue(
        of(configs)
      );
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

    it(`fires ConfigLoaded if authWellKnownEndPoints is stored`, async () => {
      const configs = [{ configId: 'configId1' }];

      vi.spyOn(configService as any, 'loadConfigs').mockReturnValue(
        of(configs)
      );
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

    it(`stores, uses and fires event when authwellknownendpoints are passed`, async () => {
      const configs = [
        {
          configId: 'configId1',
          authWellknownEndpoints: { issuer: 'auth-well-known' },
        },
      ];

      vi.spyOn(configService as any, 'loadConfigs').mockReturnValue(
        of(configs)
      );
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
    it(`returns correct result`, async () => {
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

    it(`created configId when configId is not set`, async () => {
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

    it(`returns empty array if config is not valid`, async () => {
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

  describe('setSpecialCases', () => {
    it(`should set special cases when current platform is browser`, () => {
      vi.spyOn(platformProvider, 'isBrowser').mockReturnValue(false);

      const config = { configId: 'configId1' } as OpenIdConfiguration;

      (configService as any).setSpecialCases(config);

      expect(config).toEqual({
        configId: 'configId1',
        startCheckSession: false,
        silentRenew: false,
        useRefreshToken: false,
        usePushedAuthorisationRequests: false,
      });
    });
  });
});
