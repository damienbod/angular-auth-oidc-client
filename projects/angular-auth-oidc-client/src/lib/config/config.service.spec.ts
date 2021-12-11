import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { DefaultSessionStorageService } from './../storage/default-sessionstorage.service';
import { PlatformProviderMock } from './../utils/platform-provider/platform.provider-mock';
import { AuthWellKnownService } from './auth-well-known/auth-well-known.service';
import { AuthWellKnownServiceMock } from './auth-well-known/auth-well-known.service-mock';
import { ConfigurationService } from './config.service';
import { StsConfigLoader } from './loader/config-loader';
import { StsConfigLoaderMock } from './loader/config-loader-mock';
import { OpenIdConfiguration } from './openid-configuration';
import { ConfigValidationService } from './validation/config-validation.service';

describe('Configuration Service', () => {
  let configService: ConfigurationService;
  let loggerService: LoggerService;
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
        {
          provide: LoggerService,
          useClass: LoggerServiceMock,
        },
        PublicEventsService,
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        ConfigValidationService,
        {
          provide: PlatformProvider,
          useClass: PlatformProviderMock,
        },
        DefaultSessionStorageService,
        {
          provide: AuthWellKnownService,
          useClass: AuthWellKnownServiceMock,
        },
        { provide: StsConfigLoader, useClass: StsConfigLoaderMock },
      ],
    });
  });

  beforeEach(() => {
    configService = TestBed.inject(ConfigurationService);
    loggerService = TestBed.inject(LoggerService);
    publicEventsService = TestBed.inject(PublicEventsService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    stsConfigLoader = TestBed.inject(StsConfigLoader);
    configValidationService = TestBed.inject(ConfigValidationService);
  });

  it('should create', () => {
    expect(configService).toBeTruthy();
  });

  describe('hasManyConfigs', () => {
    it('returns true if many configs are stored', () => {
      (configService as any).configsInternal = { configId1: { configId: 'configId1' }, configId2: { configId: 'configId2' } };

      const result = configService.hasManyConfigs();

      expect(result).toBe(true);
    });

    it('returns false if only one config is stored', () => {
      (configService as any).configsInternal = { configId1: { configId: 'configId1' } };

      const result = configService.hasManyConfigs();

      expect(result).toBe(false);
    });
  });

  describe('getAllConfigurations', () => {
    it('returns all configs as array', () => {
      (configService as any).configsInternal = { configId1: { configId: 'configId1' }, configId2: { configId: 'configId2' } };

      const result = configService.getAllConfigurations();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getOpenIDConfiguration', () => {
    it(
      `if config is already saved 'loadConfigs' is not called`,
      waitForAsync(() => {
        (configService as any).configsInternal = { configId1: { configId: 'configId1' }, configId2: { configId: 'configId2' } };
        const spy = spyOn(configService as any, 'loadConfigs');

        configService.getOpenIDConfiguration('configId1').subscribe((config) => {
          expect(config).toBeTruthy();
          expect(spy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      `if config is NOT already saved 'loadConfigs' is called`,
      waitForAsync(() => {
        const configs = [{ configId: 'configId1' }, { configId: 'configId2' }];
        const spy = spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);

        configService.getOpenIDConfiguration('configId1').subscribe((config) => {
          expect(config).toBeTruthy();
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      `returns null if config is not valid`,
      waitForAsync(() => {
        const configs = [{ configId: 'configId1' }];
        spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
        spyOn(configValidationService, 'validateConfig').and.returnValue(false);

        configService.getOpenIDConfiguration('configId1').subscribe((config) => {
          expect(config).toBeNull();
        });
      })
    );

    it(
      `returns null if configs are stored but not existing ID is passed`,
      waitForAsync(() => {
        (configService as any).configsInternal = { configId1: { configId: 'configId1' }, configId2: { configId: 'configId2' } };

        configService.getOpenIDConfiguration('notExisting').subscribe((config) => {
          expect(config).toBeNull();
        });
      })
    );

    it(
      `sets authWellKnownEndPoints on config if authWellKnownEndPoints is stored`,
      waitForAsync(() => {
        const configs = [{ configId: 'configId1' }];
        spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);

        spyOn(storagePersistenceService, 'read').and.returnValue({ issuer: 'auth-well-known' });

        configService.getOpenIDConfiguration('configId1').subscribe((config) => {
          expect(config.authWellknownEndpoints).toEqual({ issuer: 'auth-well-known' });
        });
      })
    );

    it(
      `fires ConfigLoaded if authWellKnownEndPoints is stored`,
      waitForAsync(() => {
        const configs = [{ configId: 'configId1' }];
        spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(storagePersistenceService, 'read').and.returnValue({ issuer: 'auth-well-known' });

        const spy = spyOn(publicEventsService, 'fireEvent');

        configService.getOpenIDConfiguration('configId1').subscribe((config) => {
          expect(spy).toHaveBeenCalledOnceWith(EventTypes.ConfigLoaded, jasmine.anything());
        });
      })
    );

    it(
      `stores, uses and fires event when authwellknownendpoints are passed`,
      waitForAsync(() => {
        const configs = [{ configId: 'configId1', authWellknownEndpoints: { issuer: 'auth-well-known' } }];
        spyOn(configService as any, 'loadConfigs').and.returnValue(of(configs));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(storagePersistenceService, 'read').and.returnValue(null);

        const fireEventSpy = spyOn(publicEventsService, 'fireEvent');
        const storeWellKnownEndpointsSpy = spyOn(authWellKnownService, 'storeWellKnownEndpoints');

        configService.getOpenIDConfiguration('configId1').subscribe((config) => {
          expect(config).toBeTruthy();
          expect(fireEventSpy).toHaveBeenCalledOnceWith(EventTypes.ConfigLoaded, jasmine.anything());
          expect(storeWellKnownEndpointsSpy).toHaveBeenCalledOnceWith(config, { issuer: 'auth-well-known' });
        });
      })
    );
  });

  describe('getOpenIDConfigurations', () => {
    it(
      `returns correct result`,
      waitForAsync(() => {
        spyOn(stsConfigLoader, 'loadConfigs').and.returnValue([
          of({ configId: 'configId1' } as OpenIdConfiguration),
          of({ configId: 'configId2' } as OpenIdConfiguration),
        ]);

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);

        configService.getOpenIDConfigurations('configId1').subscribe((result) => {
          expect(result.allConfigs.length).toEqual(2);
          expect(result.currentConfig).toBeTruthy();
        });
      })
    );

    it(
      `created configId when configId is not set`,
      waitForAsync(() => {
        spyOn(stsConfigLoader, 'loadConfigs').and.returnValue([
          of({ clientId: 'clientId1' } as OpenIdConfiguration),
          of({ clientId: 'clientId2' } as OpenIdConfiguration),
        ]);

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);

        configService.getOpenIDConfigurations().subscribe((result) => {
          expect(result.allConfigs.length).toEqual(2);
          const allConfigIds = result.allConfigs.map((x) => x.configId);
          expect(allConfigIds).toEqual(['0-clientId1', '1-clientId2']);

          expect(result.currentConfig).toBeTruthy();
          expect(result.currentConfig.configId).toBeTruthy();
        });
      })
    );

    it(
      `returns null if config is not valid`,
      waitForAsync(() => {
        spyOn(stsConfigLoader, 'loadConfigs').and.returnValue([
          of({ clientId: 'clientId1' } as OpenIdConfiguration),
          of({ clientId: 'clientId2' } as OpenIdConfiguration),
        ]);

        spyOn(configValidationService, 'validateConfigs').and.returnValue(false);

        configService.getOpenIDConfigurations().subscribe(({ allConfigs, currentConfig }) => {
          expect(allConfigs).toBeNull();
          expect(currentConfig).toBeNull();
        });
      })
    );
  });
});
