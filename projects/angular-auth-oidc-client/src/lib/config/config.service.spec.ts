import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { LogLevel } from '../logging/log-level';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence-service-mock.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
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
  let configurationProvider: ConfigurationProvider;
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
    configurationProvider = TestBed.inject(ConfigurationProvider);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    configValidationService = TestBed.inject(ConfigValidationService);
    platformProvider = TestBed.inject(PlatformProvider);
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
      'setup defines default openIDConfiguration',
      waitForAsync(() => {
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfig({ stsServer: 'https://please_set' });

        promise.then((result) => {
          expect(result).toEqual({
            stsServer: 'https://please_set',
            authWellknownEndpoint: 'https://please_set',
            redirectUrl: 'https://please_set',
            clientId: 'please_set',
            responseType: 'code',
            scope: 'openid email profile',
            hdParam: '',
            postLogoutRedirectUri: 'https://please_set',
            startCheckSession: false,
            silentRenew: false,
            silentRenewUrl: 'https://please_set',
            silentRenewTimeoutInSeconds: 20,
            renewTimeBeforeTokenExpiresInSeconds: 0,
            useRefreshToken: false,
            usePushedAuthorisationRequests: false,
            ignoreNonceAfterRefresh: false,
            postLoginRoute: '/',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            autoUserInfo: true,
            autoCleanStateAfterAuthentication: true,
            triggerAuthorizationResultEvent: false,
            logLevel: 2,
            issValidationOff: false,
            historyCleanupOff: false,
            maxIdTokenIatOffsetAllowedInSeconds: 120,
            disableIatOffsetValidation: false,
            storage: sessionStorage,
            customParams: {},
            eagerLoadAuthWellKnownEndpoints: true,
            disableRefreshIdTokenAuthTimeValidation: false,
            tokenRefreshInSeconds: 4,
            refreshTokenRetryInSeconds: 3,
            ngswBypass: false,
          });
        });
      })
    );

    it(
      'if authWellKnownEndPointsAlreadyStored the events are fired and resolve',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', authWellknownEndpoint: null };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ any: 'thing' });
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfig(config);
        promise.then(() => {
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            configuration: {
              ...DEFAULT_CONFIG,
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
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const storeWellKnownEndpointsSpy = spyOn(authWellKnownService, 'storeWellKnownEndpoints');
        const promise = oidcConfigService.withConfig(config, authWellKnown);
        promise.then(() => {
          expect(storeWellKnownEndpointsSpy).toHaveBeenCalledWith(authWellKnown);
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            configuration: {
              ...DEFAULT_CONFIG,
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
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
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
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
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
      'silent_renew and start_checksession are always false when not using the browser platform',
      waitForAsync(() => {
        const config: OpenIdConfiguration = {
          silentRenew: true,
          stsServer: '',
          startCheckSession: true,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
          eagerLoadAuthWellKnownEndpoints: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        oidcConfigService.withConfig(config).then(({ silentRenew, startCheckSession }) => {
          expect(silentRenew).toEqual(false);
          expect(startCheckSession).toEqual(false);
        });
      })
    );

    it(
      'silent_renew and start_checksession stay on true when true is passed and using the browser platform',
      waitForAsync(() => {
        const config: OpenIdConfiguration = {
          silentRenew: true,
          stsServer: '',
          startCheckSession: true,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfig(config).then(({ silentRenew, startCheckSession }) => {
          expect(silentRenew).toEqual(true);
          expect(startCheckSession).toEqual(true);
        });
      })
    );

    it(
      'setup calls setSpecialCases',
      waitForAsync(() => {
        const config = {
          stsServer: 'stsServer',
          startCheckSession: true,
          silentRenew: true,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const spy = spyOn(oidcConfigService as any, 'setSpecialCases');
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfig(config).then(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is true: fire event',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', eagerLoadAuthWellKnownEndpoints: true };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
        spyOn(configurationProvider, 'setConfig').and.returnValue(config);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const promise = oidcConfigService.withConfig(config);
        promise.then(() => {
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            configuration: { ...DEFAULT_CONFIG, ...config, authWellknownEndpoint: 'stsServerForTesting' },
            wellknown: { issuer: 'issuerForTesting' },
          });
        });
      })
    );

    it(
      'setup merges default and passed config',
      waitForAsync(() => {
        const config = {
          stsServer: 'stsServer',
        };

        const expected = {
          stsServer: config.stsServer,
          authWellknownEndpoint: 'stsServer',
          redirectUrl: 'https://please_set',
          clientId: 'please_set',
          responseType: 'code',
          scope: 'openid email profile',
          hdParam: '',
          postLogoutRedirectUri: 'https://please_set',
          startCheckSession: false,
          silentRenew: false,
          silentRenewUrl: 'https://please_set',
          silentRenewTimeoutInSeconds: 20,
          renewTimeBeforeTokenExpiresInSeconds: 0,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
          ignoreNonceAfterRefresh: false,
          postLoginRoute: '/',
          forbiddenRoute: '/forbidden',
          unauthorizedRoute: '/unauthorized',
          autoUserInfo: true,
          autoCleanStateAfterAuthentication: true,
          triggerAuthorizationResultEvent: false,
          logLevel: LogLevel.Warn,
          issValidationOff: false,
          historyCleanupOff: false,
          maxIdTokenIatOffsetAllowedInSeconds: 120,
          disableIatOffsetValidation: false,
          storage: sessionStorage,
          customParams: {},
          eagerLoadAuthWellKnownEndpoints: true,
          disableRefreshIdTokenAuthTimeValidation: false,
          tokenRefreshInSeconds: 4,
          refreshTokenRetryInSeconds: 3,
          ngswBypass: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfig(config).then((result) => {
          expect(result).toEqual(expected);
        });
      })
    );

    it(
      'setup sets special cases',
      waitForAsync(() => {
        const config = {
          stsServer: 'stsServer',
          startCheckSession: true,
          silentRenew: true,
        };

        const expected = {
          stsServer: config.stsServer,
          authWellknownEndpoint: 'stsServer',
          redirectUrl: 'https://please_set',
          clientId: 'please_set',
          responseType: 'code',
          scope: 'openid email profile',
          hdParam: '',
          postLogoutRedirectUri: 'https://please_set',
          startCheckSession: false,
          silentRenew: false,
          silentRenewUrl: 'https://please_set',
          silentRenewTimeoutInSeconds: 20,
          renewTimeBeforeTokenExpiresInSeconds: 0,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
          ignoreNonceAfterRefresh: false,
          postLoginRoute: '/',
          forbiddenRoute: '/forbidden',
          unauthorizedRoute: '/unauthorized',
          autoUserInfo: true,
          autoCleanStateAfterAuthentication: true,
          triggerAuthorizationResultEvent: false,
          logLevel: LogLevel.Warn,
          issValidationOff: false,
          historyCleanupOff: false,
          maxIdTokenIatOffsetAllowedInSeconds: 120,
          disableIatOffsetValidation: false,
          storage: sessionStorage,
          customParams: {},
          eagerLoadAuthWellKnownEndpoints: true,
          disableRefreshIdTokenAuthTimeValidation: false,
          tokenRefreshInSeconds: 4,
          refreshTokenRetryInSeconds: 3,
          ngswBypass: false,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));

        oidcConfigService.withConfig(config).then((result) => {
          expect(result).toEqual(expected);
        });
      })
    );
  });
});
