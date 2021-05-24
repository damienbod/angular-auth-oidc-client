import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { LogLevel } from '../logging/log-level';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
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

fdescribe('Configuration Service', () => {
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

  describe('withConfig', () => {
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

    fit(
      'setup defines default openIDConfiguration',
      waitForAsync(() => {
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([{ stsServer: 'https://please_set', clientId: 'clientId' }]);

        promise.then((result) => {
          expect(result).toEqual([
            {
              ...DEFAULT_CONFIG,
              stsServer: 'https://please_set',
              clientId: 'clientId',
              configId: '0-clientId',
              authWellKnownEndpoints: null,
            },
          ]);
        });
      })
    );

    it(
      'if authWellKnownEndPointsAlreadyStored the events are fired and resolve',
      waitForAsync(() => {
        const config = {
          stsServer: 'stsServerForTesting',
          clientId: 'clientId',
        };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', '0-clientId').and.returnValue({ any: 'thing' });
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const promise = oidcConfigService.withConfigs([config]);

        promise.then((result) => {
          expect(eventServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoaded, {
            ...DEFAULT_CONFIG,
            stsServer: 'stsServerForTesting',
            authWellknownEndpointUrl: 'stsServerForTesting',
            clientId: 'clientId',
            configId: '0-clientId',
            authWellknownEndpoints: {
              any: 'thing',
            },
          });
        });
      })
    );

    it(
      'if passedAuthWellKnownEndpoints are passed, set these, fire event and resolve',
      waitForAsync(() => {
        const authWellKnown = { issuer: 'issuerForTesting' };
        const config = { stsServer: 'stsServerForTesting', authWellknownEndpoint: authWellKnown, clientId: 'clientId' };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', '0-clientId').and.returnValue(null);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const storeWellKnownEndpointsSpy = spyOn(authWellKnownService, 'storeWellKnownEndpoints');
        const promise = oidcConfigService.withConfigs([config]);

        promise.then(() => {
          expect(storeWellKnownEndpointsSpy).toHaveBeenCalledWith('configId', authWellKnown);
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
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        const getWellKnownEndPointsFromUrlSpy = spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of(null));
        const promise = oidcConfigService.withConfigs([config]);
        promise.then(() => {
          expect(getWellKnownEndPointsFromUrlSpy).toHaveBeenCalledWith('stsServerForTesting', 'configId');
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is false: DO NOT call getAuthWellKnownEndPoints',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', eagerLoadAuthWellKnownEndpoints: false };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
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
          stsServer: '',
          startCheckSession: true,
          useRefreshToken: false,
          usePushedAuthorisationRequests: false,
          eagerLoadAuthWellKnownEndpoints: false,
        };

        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        oidcConfigService.withConfigs([config]).then(({ silentRenew, startCheckSession }) => {
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

        oidcConfigService.withConfigs([config]).then(({ silentRenew, startCheckSession }) => {
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

        oidcConfigService.withConfigs([config]).then(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if eagerLoadAuthWellKnownEndpoints is true: fire event',
      waitForAsync(() => {
        const config = { stsServer: 'stsServerForTesting', eagerLoadAuthWellKnownEndpoints: true };
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
        spyOn(configValidationService, 'validateConfig').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({ issuer: 'issuerForTesting' }));
        const eventServiceSpy = spyOn(eventsService, 'fireEvent');
        const promise = oidcConfigService.withConfigs([config]);
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

        oidcConfigService.withConfigs([config]).then((result) => {
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

        oidcConfigService.withConfigs([config]).then((result) => {
          expect(result).toEqual(expected);
        });
      })
    );
  });
});

var diff = function (obj1, obj2) {
  // Make sure an object to compare is provided
  if (!obj2 || Object.prototype.toString.call(obj2) !== '[object Object]') {
    return obj1;
  }

  //
  // Variables
  //

  var diffs = {};
  var key;

  //
  // Methods
  //

  /**
   * Check if two arrays are equal
   * @param  {Array}   arr1 The first array
   * @param  {Array}   arr2 The second array
   * @return {Boolean}      If true, both arrays are equal
   */
  var arraysMatch = function (arr1, arr2) {
    // Check if the arrays are the same length
    if (arr1.length !== arr2.length) return false;

    // Check if all items exist and are in the same order
    for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }

    // Otherwise, return true
    return true;
  };

  /**
   * Compare two items and push non-matches to object
   * @param  {*}      item1 The first item
   * @param  {*}      item2 The second item
   * @param  {String} key   The key in our object
   */
  var compare = function (item1, item2, key) {
    // Get the object type
    var type1 = Object.prototype.toString.call(item1);
    var type2 = Object.prototype.toString.call(item2);

    // If type2 is undefined it has been removed
    if (type2 === '[object Undefined]') {
      diffs[key] = null;
      return;
    }

    // If items are different types
    if (type1 !== type2) {
      diffs[key] = item2;
      return;
    }

    // If an object, compare recursively
    if (type1 === '[object Object]') {
      var objDiff = diff(item1, item2);
      if (Object.keys(objDiff).length > 0) {
        diffs[key] = objDiff;
      }
      return;
    }

    // If an array, compare
    if (type1 === '[object Array]') {
      if (!arraysMatch(item1, item2)) {
        diffs[key] = item2;
      }
      return;
    }

    // Else if it's a function, convert to a string and compare
    // Otherwise, just compare
    if (type1 === '[object Function]') {
      if (item1.toString() !== item2.toString()) {
        diffs[key] = item2;
      }
    } else {
      if (item1 !== item2) {
        diffs[key] = item2;
      }
    }
  };

  //
  // Compare our objects
  //

  // Loop through the first object
  for (key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      compare(obj1[key], obj2[key], key);
    }
  }

  // Loop through the second object and find missing items
  for (key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (!obj1[key] && obj1[key] !== obj2[key]) {
        diffs[key] = obj2[key];
      }
    }
  }

  // Return the object of differences
  return diffs;
};
