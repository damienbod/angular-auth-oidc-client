import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { ConfigValidationService } from '../config-validation/config-validation.service';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { AuthWellKnownService } from './auth-well-known.service';
import { AuthWellKnownServiceMock } from './auth-well-known.service-mock';
import { ConfigurationProvider } from './config.provider';
import { ConfigurationProviderMock } from './config.provider-mock';
import { OidcConfigService } from './config.service';

describe('Configuration Service', () => {
  let oidcConfigService: OidcConfigService;
  let loggerService: LoggerService;
  let eventsService: PublicEventsService;
  let configurationProvider: ConfigurationProvider;
  let authWellKnownService: AuthWellKnownService;
  let storagePersistanceService: StoragePersistanceService;
  let configValidationService: ConfigValidationService;

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
          provide: StoragePersistanceService,
          useClass: StoragePersistanceServiceMock,
        },
        PublicEventsService,
        ConfigValidationService,
      ],
    });
  });

  beforeEach(() => {
    oidcConfigService = TestBed.inject(OidcConfigService);
    loggerService = TestBed.inject(LoggerService);
    eventsService = TestBed.inject(PublicEventsService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    configValidationService = TestBed.inject(ConfigValidationService);
  });

  it('should create', () => {
    expect(oidcConfigService).toBeTruthy();
  });

  it('should return a promise', () => {
    expect(oidcConfigService.withConfig({})).toEqual(jasmine.any(Promise));
  });

  describe('withConfig', () => {
    it(
      'not valid config does nothing and logs error',
      waitForAsync(() => {
        const config = {};
        spyOn(loggerService, 'logError');
        spyOn(configValidationService, 'validateConfig').and.returnValue(false);

        const promise = oidcConfigService.withConfig(config);

        promise.then(() => {
          expect(loggerService.logError).toHaveBeenCalled();
        });
      })
    );

    it(
      'if authWellKnownEndPointsAlreadyStored the events are fired and resolve',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', authWellknownEndpoint: null };
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ any: 'thing' });
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfig(config);
        promise.then(() => {
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            configuration: {
              stsServer: 'stsServerForTesting',
              authWellknownEndpoint: 'stsServerForTesting',
            },
            wellknown: { any: 'thing' },
          });
        });
      })
    );

    it(
      'if passedAuthWellKnownEndpoints are passed, set these, fire event and resolve',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', authWellknownEndpoint: null };
        const authWellKnown = { issuer: 'issuerForTesting' };
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const storeWellKnownEndpointsSpy = spyOn(authWellKnownService, 'storeWellKnownEndpoints');
        const promise = oidcConfigService.withConfig(config, authWellKnown);
        promise.then(() => {
          expect(storeWellKnownEndpointsSpy).toHaveBeenCalledWith(authWellKnown);
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            configuration: {
              stsServer: 'stsServerForTesting',
              authWellknownEndpoint: 'stsServerForTesting',
            },
            wellknown: authWellKnown,
          });
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is true: call getAuthWellKnownEndPoints',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', eagerLoadAuthWellKnownEndpoints: true };
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        spyOn(configurationProvider, 'setConfig').and.returnValue(config);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const getWellKnownEndPointsFromUrlSpy = spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        const promise = oidcConfigService.withConfig(config);
        promise.then(() => {
          expect(getWellKnownEndPointsFromUrlSpy).toHaveBeenCalledWith('stsServerForTesting');
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is false: DO NOT call getAuthWellKnownEndPoints',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', eagerLoadAuthWellKnownEndpoints: false };
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        const storeWellKnownEndpointsSpy = spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configurationProvider, 'setConfig').and.returnValue(config);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfig(config);
        promise.then(() => {
          expect(storeWellKnownEndpointsSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is true: fire event',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', eagerLoadAuthWellKnownEndpoints: true };
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        spyOn(configurationProvider, 'setConfig').and.returnValue(config);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const promise = oidcConfigService.withConfig(config);
        promise.then(() => {
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            configuration: { ...config, authWellknownEndpoint: 'stsServerForTesting' },
            wellknown: { issuer: 'issuerForTesting' },
          });
        });
      })
    );
  });
});
