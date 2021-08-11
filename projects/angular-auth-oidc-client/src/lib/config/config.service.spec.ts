import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
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
import { OidcConfigService } from './config.service';
import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';
import { ConfigurationProvider } from './provider/config.provider';
import { ConfigurationProviderMock } from './provider/config.provider-mock';
import { ConfigValidationService } from './validation/config-validation.service';

describe('Configuration Service', () => {
  let oidcConfigService: OidcConfigService;
  let loggerService: LoggerService;
  let eventsService: PublicEventsService;
  let authWellKnownService: AuthWellKnownService;
  let storagePersistenceService: StoragePersistenceService;
  let configValidationService: ConfigValidationService;
  let platformProvider: PlatformProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OidcConfigService,
        {
          provide: LoggerService,
          useClass: LoggerServiceMock,
        },
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
        {
          provide: DataService,
          useClass: DataServiceMock,
        },
        {
          provide: AuthWellKnownService,
          useClass: AuthWellKnownServiceMock,
        },
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        {
          provide: PlatformProvider,
          useClass: PlatformProviderMock,
        },
        PublicEventsService,
        ConfigValidationService,
        PlatformProvider,
      ],
    });
  });

  beforeEach(() => {
    oidcConfigService = TestBed.inject(OidcConfigService);
    loggerService = TestBed.inject(LoggerService);
    eventsService = TestBed.inject(PublicEventsService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    configValidationService = TestBed.inject(ConfigValidationService);
    platformProvider = TestBed.inject(PlatformProvider);
  });

  it('should create', () => {
    expect(oidcConfigService).toBeTruthy();
  });

  it('should return a promise', () => {
    expect(oidcConfigService.withConfigs([])).toEqual(jasmine.any(Promise));
  });

  describe('withConfigs', () => {
    it(
      'not valid configs does nothing and logs error',
      waitForAsync(() => {
        const config = {};
        spyOn(configValidationService, 'validateConfigs').and.returnValue(false);

        const promise = oidcConfigService.withConfigs([config]);

        promise.then((result) => {
          expect(result).toBeNull();
        });
      })
    );

    it(
      'not valid config does nothing and logs error',
      waitForAsync(() => {
        const config = {};
        spyOn(loggerService, 'logError');
        spyOn(configValidationService, 'validateConfig').and.returnValue(false);

        const promise = oidcConfigService.withConfigs([config]);

        promise.then(() => {
          expect(loggerService.logError).toHaveBeenCalled();
        });
      })
    );

    it(
      'configId is being generated with index and clientId',
      waitForAsync(() => {
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([{ authority: 'https://please_set', clientId: 'clientId' }]);

        promise.then((result) => {
          expect(result[0].configId).toEqual('0-clientId');
        });
      })
    );

    it(
      'configId is not being generated (overwritten) when present already',
      waitForAsync(() => {
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([{ authority: 'https://please_set', clientId: 'clientId', configId: 'myConfigId' }]);

        promise.then((result) => {
          expect(result[0].configId).toEqual('myConfigId');
        });
      })
    );

    it(
      'authWellknownEndpointUrl is not being overwritten with authority when present already',
      waitForAsync(() => {
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([
          { authority: 'https://please_set', clientId: 'clientId', authWellknownEndpointUrl: 'my-auth-url' },
        ]);

        promise.then((result) => {
          expect(result[0].authWellknownEndpointUrl).toEqual('my-auth-url');
        });
      })
    );

    it(
      'setup defines default openIDConfiguration',
      waitForAsync(() => {
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([{ authority: 'https://please_set', clientId: 'clientId' }]);

        promise.then((result) => {
          expect(result).toEqual([
            {
              ...DEFAULT_CONFIG,
              authority: 'https://please_set',
              authWellknownEndpointUrl: 'https://please_set',
              clientId: 'clientId',
              configId: '0-clientId',
              storage: new DefaultSessionStorageService(),
            },
          ]);
        });
      })
    );

    it(
      'if authWellKnownEndPointsAlreadyStored the events are fired and resolve',
      waitForAsync(() => {
        const config = {
          authority: 'authorityForTesting',
          clientId: 'clientId',
        };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', '0-clientId').and.returnValue({ any: 'thing' });
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([config]);

        promise.then((result) => {
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            ...DEFAULT_CONFIG,
            authority: 'authorityForTesting',
            authWellknownEndpointUrl: 'authorityForTesting',
            clientId: 'clientId',
            configId: '0-clientId',
            authWellknownEndpoints: {
              any: 'thing',
            },
            storage: new DefaultSessionStorageService(),
          });
        });
      })
    );

    it(
      'if passedAuthWellKnownEndpoints are passed, set these, fire event and resolve',
      waitForAsync(() => {
        const authWellKnown = { issuer: 'issuerForTesting' };
        const config = { authority: 'authorityForTesting', authWellknownEndpoints: authWellKnown, clientId: 'clientId' };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', '0-clientId').and.returnValue(null);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const storeWellKnownEndpointsSpy = spyOn(authWellKnownService, 'storeWellKnownEndpoints');

        const promise = oidcConfigService.withConfigs([config]);

        promise.then(() => {
          expect(storeWellKnownEndpointsSpy).toHaveBeenCalledWith('0-clientId', authWellKnown);
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            ...DEFAULT_CONFIG,
            authority: 'authorityForTesting',
            configId: '0-clientId',
            clientId: 'clientId',
            authWellknownEndpointUrl: 'authorityForTesting',
            authWellknownEndpoints: { issuer: 'issuerForTesting' },
            storage: new DefaultSessionStorageService(),
          });
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is true: call getAuthWellKnownEndPoints',
      waitForAsync(() => {
        const config = { authority: 'authorityForTesting', clientId: 'clientId', eagerLoadAuthWellKnownEndpoints: true };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', '0-clientId').and.returnValue(null);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const getWellKnownEndPointsFromUrlSpy = spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        const promise = oidcConfigService.withConfigs([config]);
        promise.then(() => {
          expect(getWellKnownEndPointsFromUrlSpy).toHaveBeenCalledWith('authorityForTesting', '0-clientId');
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is false: DO NOT call getAuthWellKnownEndPoints',
      waitForAsync(() => {
        const config = { authority: 'authorityForTesting', clientId: 'clientId', eagerLoadAuthWellKnownEndpoints: false };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', '0-clientId').and.returnValue(null);
        const storeWellKnownEndpointsSpy = spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([config]);
        promise.then(() => {
          expect(storeWellKnownEndpointsSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'silent_renew and start_checksession are always false when not using the browser platform',
      waitForAsync(() => {
        const config: OpenIdConfiguration = {
          silentRenew: true,
          authority: '',
          startCheckSession: true,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
          eagerLoadAuthWellKnownEndpoints: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        oidcConfigService.withConfigs([config]).then((result) => {
          expect(result[0].silentRenew).toEqual(false);
          expect(result[0].startCheckSession).toEqual(false);
        });
      })
    );

    it(
      'silent_renew and start_checksession stay on true when true is passed and using the browser platform',
      waitForAsync(() => {
        const config: OpenIdConfiguration = {
          silentRenew: true,
          authority: '',
          startCheckSession: true,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfigs([config]).then(([{ silentRenew, startCheckSession }]) => {
          expect(silentRenew).toEqual(true);
          expect(startCheckSession).toEqual(true);
        });
      })
    );

    it(
      'setup calls setSpecialCases',
      waitForAsync(() => {
        const config = {
          authority: 'authority',
          startCheckSession: true,
          silentRenew: true,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const spy = spyOn(oidcConfigService as any, 'setSpecialCases');
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfigs([config]).then(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is true: fire event',
      waitForAsync(() => {
        const config = {
          authority: 'authorityForTesting',
          clientId: 'clientId',
          eagerLoadAuthWellKnownEndpoints: true,
          storage: new DefaultSessionStorageService(),
        };

        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', '0-clientId').and.returnValue(null);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const promise = oidcConfigService.withConfigs([config]);
        promise.then(() => {
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            ...DEFAULT_CONFIG,
            ...config,
            authWellknownEndpointUrl: 'authorityForTesting',
            authWellknownEndpoints: { issuer: 'issuerForTesting' },
          });
        });
      })
    );

    it(
      'setup merges default and passed config',
      waitForAsync(() => {
        const config = {
          authority: 'authority',
          clientId: 'clientId',
        };

        const expected = {
          ...DEFAULT_CONFIG,
          ...config,
          configId: '0-clientId',
          authWellknownEndpointUrl: 'authority',
          authWellknownEndpoints: { issuer: 'issuerForTesting' },
          storage: new DefaultSessionStorageService(),
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfigs([config]).then((result) => {
          expect(result).toEqual([expected]);
        });
      })
    );

    it(
      'setup sets special cases',
      waitForAsync(() => {
        const config = {
          authority: 'authority',
          startCheckSession: true,
          silentRenew: true,
          clientId: 'clientId',
        };

        const expected = {
          ...DEFAULT_CONFIG,
          ...config,
          configId: '0-clientId',
          authWellknownEndpointUrl: 'authority',
          authWellknownEndpoints: { issuer: 'issuerForTesting' },

          startCheckSession: false,
          silentRenew: false,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
          storage: new DefaultSessionStorageService(),
        } as OpenIdConfiguration;

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfigs([config]).then((result) => {
          expect(result[0]).toEqual(expected);
        });
      })
    );
  });
});
