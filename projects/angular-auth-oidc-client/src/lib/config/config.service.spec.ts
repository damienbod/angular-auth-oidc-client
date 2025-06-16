import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
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
    it(`if config is already saved 'loadConfigs' is not called`, waitForAsync(() => {
      (configService as any).configsInternal = {
        configId1: { configId: 'configId1' },
        configId2: { configId: 'configId2' },
      };
      const spy = spyOn(configService as any, 'loadConfigs');

      configService.getOpenIDConfiguration('configId1').subscribe((config) => {
        expect(config).toBeTruthy();
        expect(spy).not.toHaveBeenCalled();
      });
    }));

    it(`if config is NOT already saved 'loadConfigs' is called`, waitForAsync(() => {
      const configs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const spy = spyOn(configService as any, 'loadConfigs').and.returnValue(
        of(configs)
      );

      spyOn(configValidationService, 'validateConfig').and.returnValue(true);

      configService.getOpenIDConfiguration('configId1').subscribe((config) => {
        expect(config).toBeTruthy();
        expect(spy).toHaveBeenCalled();
      });
    }));

    it(`returns null if config is not valid`, waitForAsync(() => {
      const configs = [{ configId: 'configId1' }];

      spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
      spyOn(configValidationService, 'validateConfig').and.returnValue(false);
      const consoleSpy = spyOn(console, 'warn');

      configService.getOpenIDConfiguration('configId1').subscribe((config) => {
        expect(config).toBeNull();
        expect(consoleSpy).toHaveBeenCalledOnceWith(
          `[angular-auth-oidc-client] No configuration found for config id 'configId1'.`
        );
      });
    }));

    it(`returns null if configs are stored but not existing ID is passed`, waitForAsync(() => {
      (configService as any).configsInternal = {
        configId1: { configId: 'configId1' },
        configId2: { configId: 'configId2' },
      };

      configService
        .getOpenIDConfiguration('notExisting')
        .subscribe((config) => {
          expect(config).toBeNull();
        });
    }));

    it(`sets authWellKnownEndPoints on config if authWellKnownEndPoints is stored`, waitForAsync(() => {
      const configs = [{ configId: 'configId1' }];

      spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
      spyOn(configValidationService, 'validateConfig').and.returnValue(true);
      const consoleSpy = spyOn(console, 'warn');

      spyOn(storagePersistenceService, 'read').and.returnValue({
        issuer: 'auth-well-known',
      });

      configService.getOpenIDConfiguration('configId1').subscribe((config) => {
        expect(config?.authWellknownEndpoints).toEqual({
          issuer: 'auth-well-known',
        });
        expect(consoleSpy).not.toHaveBeenCalled();
      });
    }));

    it(`fires ConfigLoaded if authWellKnownEndPoints is stored`, waitForAsync(() => {
      const configs = [{ configId: 'configId1' }];

      spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
      spyOn(configValidationService, 'validateConfig').and.returnValue(true);
      spyOn(storagePersistenceService, 'read').and.returnValue({
        issuer: 'auth-well-known',
      });

      const spy = spyOn(publicEventsService, 'fireEvent');

      configService.getOpenIDConfiguration('configId1').subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(
          EventTypes.ConfigLoaded,
          jasmine.anything()
        );
      });
    }));

    it(`stores, uses and fires event when authwellknownendpoints are passed`, waitForAsync(() => {
      const configs = [
        {
          configId: 'configId1',
          authWellknownEndpoints: { issuer: 'auth-well-known' },
        },
      ];

      spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
      spyOn(configValidationService, 'validateConfig').and.returnValue(true);
      spyOn(storagePersistenceService, 'read').and.returnValue(null);

      const fireEventSpy = spyOn(publicEventsService, 'fireEvent');
      const storeWellKnownEndpointsSpy = spyOn(
        authWellKnownService,
        'storeWellKnownEndpoints'
      );

      configService.getOpenIDConfiguration('configId1').subscribe((config) => {
        expect(config).toBeTruthy();
        expect(fireEventSpy).toHaveBeenCalledOnceWith(
          EventTypes.ConfigLoaded,
          jasmine.anything()
        );
        expect(storeWellKnownEndpointsSpy).toHaveBeenCalledOnceWith(
          config as OpenIdConfiguration,
          {
            issuer: 'auth-well-known',
          }
        );
      });
    }));
  });

  describe('getOpenIDConfigurations', () => {
    it(`returns correct result`, waitForAsync(() => {
      spyOn(stsConfigLoader, 'loadConfigs').and.returnValue(
        of([
          { configId: 'configId1' } as OpenIdConfiguration,
          { configId: 'configId2' } as OpenIdConfiguration,
        ])
      );

      spyOn(configValidationService, 'validateConfig').and.returnValue(true);

      configService.getOpenIDConfigurations('configId1').subscribe((result) => {
        expect(result.allConfigs.length).toEqual(2);
        expect(result.currentConfig).toBeTruthy();
      });
    }));

    it(`created configId when configId is not set`, waitForAsync(() => {
      spyOn(stsConfigLoader, 'loadConfigs').and.returnValue(
        of([
          { clientId: 'clientId1' } as OpenIdConfiguration,
          { clientId: 'clientId2' } as OpenIdConfiguration,
        ])
      );

      spyOn(configValidationService, 'validateConfig').and.returnValue(true);

      configService.getOpenIDConfigurations().subscribe((result) => {
        expect(result.allConfigs.length).toEqual(2);
        const allConfigIds = result.allConfigs.map((x) => x.configId);

        expect(allConfigIds).toEqual(['0-clientId1', '1-clientId2']);

        expect(result.currentConfig).toBeTruthy();
        expect(result.currentConfig?.configId).toBeTruthy();
      });
    }));

    it(`returns empty array if config is not valid`, waitForAsync(() => {
      spyOn(stsConfigLoader, 'loadConfigs').and.returnValue(
        of([
          { configId: 'configId1' } as OpenIdConfiguration,
          { configId: 'configId2' } as OpenIdConfiguration,
        ])
      );

      spyOn(configValidationService, 'validateConfigs').and.returnValue(false);

      configService
        .getOpenIDConfigurations()
        .subscribe(({ allConfigs, currentConfig }) => {
          expect(allConfigs).toEqual([]);
          expect(currentConfig).toBeNull();
        });
    }));
  });

  describe('setSpecialCases', () => {
    it(`should set special cases when current platform is browser`, () => {
      spyOn(platformProvider, 'isBrowser').and.returnValue(false);

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
