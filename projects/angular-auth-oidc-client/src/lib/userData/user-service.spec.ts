import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { TokenHelperService } from '../utils/tokenHelper/oidc-token-helper.service';
import { UserService } from './user-service';

describe('User Service', () => {
  let configProvider: ConfigurationProvider;
  let loggerService: LoggerService;
  let userService: UserService;
  let storagePersistanceService: StoragePersistanceService;
  let eventsService: PublicEventsService;
  let dataService: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: StoragePersistanceService,
          useClass: StoragePersistanceServiceMock,
        },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: DataService, useClass: DataServiceMock },
        { provide: PlatformProvider, useClass: PlatformProviderMock },
        PublicEventsService,
        TokenHelperService,
        ConfigurationProvider,
        UserService,
        FlowHelper,
      ],
    });
  });

  beforeEach(() => {
    configProvider = TestBed.inject(ConfigurationProvider);
    loggerService = TestBed.inject(LoggerService);
    userService = TestBed.inject(UserService);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    eventsService = TestBed.inject(PublicEventsService);
    dataService = TestBed.inject(DataService);
  });

  it('should create', () => {
    expect(userService).toBeTruthy();
  });

  it('public authorize$ is observable$', () => {
    expect(userService.userData$).toEqual(jasmine.any(Observable));
  });

  describe('getAndPersistUserDataInStore', () => {
    it(
      'if not currentFlow is NOT id Token or Code flow, return decoded ID Token - passed as argument',
      waitForAsync(() => {
        const isRenewProcess = false;
        const idToken = false;
        const decodedIdToken = 'decodedIdToken';
        const userDataInstore = '';

        const config = {
          responseType: 'notcode',
        };

        configProvider.setConfig(config);

        spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);

        userService.getAndPersistUserDataInStore(isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
          expect(decodedIdToken).toBe(token);
        });
      })
    );

    it(
      'if not currentFlow is NOT id Token or Code flow, "setUserDataToStore" is called with the decodedIdToken',
      waitForAsync(() => {
        const isRenewProcess = false;
        const idToken = false;
        const decodedIdToken = 'decodedIdToken';
        const userDataInstore = '';

        const config = {
          responseType: 'notcode',
        };

        configProvider.setConfig(config);

        spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
        spyOn(userService, 'setUserDataToStore');

        userService.getAndPersistUserDataInStore(isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
          expect(decodedIdToken).toBe(token);
        });

        expect(userService.setUserDataToStore).toHaveBeenCalled();
      })
    );

    it(
      'if not currentFlow is id token or code flow with renewprocess going -> return existing data from storage',
      waitForAsync(() => {
        const isRenewProcess = true;
        const idToken = false;
        const decodedIdToken = 'decodedIdToken';
        const userDataInstore = 'userDataInstore';

        const config = {
          responseType: 'code',
        };

        configProvider.setConfig(config);

        spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);

        userService.getAndPersistUserDataInStore(isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
          expect(userDataInstore).toBe(token);
        });
      })
    );

    it(
      'if not currentFlow is id token or code flow and not renewprocess --> ask server for data',
      waitForAsync(() => {
        const isRenewProcess = false;
        const idToken = false;
        const decodedIdToken = 'decodedIdToken';
        const userDataInstore = '';
        const userDataFromSts = 'userDataFromSts';

        const config = {
          responseType: 'code',
        };

        configProvider.setConfig(config);

        spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
        const spy = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));

        userService.getAndPersistUserDataInStore(isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
          expect(userDataFromSts).toEqual(token);
        });

        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      `if not currentFlow is id token or code flow and not renewprocess
          --> ask server for data
          --> logging if it has userdata`,
      waitForAsync(() => {
        const isRenewProcess = false;
        const idToken = false;
        const decodedIdToken = 'decodedIdToken';
        const userDataInstore = '';
        const userDataFromSts = 'userDataFromSts';

        const config = {
          responseType: 'code',
        };

        configProvider.setConfig(config);

        spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
        const spy = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));
        spyOn(loggerService, 'logDebug');
        spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('accessToken');

        userService.getAndPersistUserDataInStore(isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
          expect(userDataFromSts).toEqual(token);
        });

        expect(spy).toHaveBeenCalled();
        expect(loggerService.logDebug).toHaveBeenCalled();
      })
    );

    it(
      `if not currentFlow is id token or code flow and not renewprocess
          --> ask server for data
          --> throwing Error if it has no userdata `,
      waitForAsync(() => {
        const isRenewProcess = false;
        const idToken = false;
        const decodedIdToken = { sub: 'decodedIdToken' };
        const userDataInstore = '';
        const userDataFromSts = null;

        const config = {
          responseType: 'code',
        };

        configProvider.setConfig(config);

        spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
        const spyGetIdentityUserData = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));
        spyOn(loggerService, 'logDebug');
        spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('accessToken');

        userService.getAndPersistUserDataInStore(isRenewProcess, idToken, decodedIdToken).subscribe({
          error: (err) => {
            expect(err).toEqual('no user data, request failed');
            expect(err).not.toEqual('some other message');
          },
        });

        expect(spyGetIdentityUserData).toHaveBeenCalled();
      })
    );

    it(
      `if not currentFlow is id token or code flow and renewprocess and renewUserInfoAfterTokenRenew
          --> ask server for data`,
      waitForAsync(() => {
        const isRenewProcess = true;
        const idToken = false;
        const decodedIdToken = 'decodedIdToken';
        const userDataInstore = 'userDataInStore';
        const userDataFromSts = 'userDataFromSts';

        const config = {
          responseType: 'code',
          renewUserInfoAfterTokenRenew: true,
        };

        configProvider.setConfig(config);

        spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
        const spy = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));

        userService.getAndPersistUserDataInStore(isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
          expect(userDataFromSts).toEqual(token);
        });

        expect(spy).toHaveBeenCalled();
      })
    );
  });

  describe('getUserDataFromStore', () => {
    it('returns null if there is not data', () => {
      const result = userService.getUserDataFromStore();
      expect(result).toBeNull();
    });

    it('returns value if there is data', () => {
      spyOn(storagePersistanceService, 'read').withArgs('userData').and.returnValue('userData');
      const result = userService.getUserDataFromStore();
      expect(result).toBeTruthy();
    });
  });

  describe('setUserDataToStore', () => {
    it('sets userdata in storagePersistanceService', () => {
      const spy = spyOn(storagePersistanceService, 'write');
      userService.setUserDataToStore('userDataForTest');
      expect(spy).toHaveBeenCalledWith('userData', 'userDataForTest');
    });

    it('userDataInternal$ is called when userdata is set', () => {
      const spy = spyOn((userService as any).userDataInternal$, 'next');
      userService.setUserDataToStore('userDataForTest');
      expect(spy).toHaveBeenCalledWith('userDataForTest');
    });

    it('eventService.fireEvent is called when userdata is set', () => {
      const spy = spyOn(eventsService, 'fireEvent');
      userService.setUserDataToStore('userDataForTest');
      expect(spy).toHaveBeenCalledWith(EventTypes.userDataChanged, 'userDataForTest');
    });
  });

  describe('resetUserDataInStore', () => {
    it('resets userdata sets null in storagePersistanceService', () => {
      const spy = spyOn(storagePersistanceService, 'remove');
      userService.resetUserDataInStore();
      expect(spy).toHaveBeenCalledWith('userData');
    });

    it('userDataInternal$ is called with null when userdata is reset', () => {
      const spy = spyOn((userService as any).userDataInternal$, 'next');
      userService.resetUserDataInStore();
      expect(spy).toHaveBeenCalledWith(null);
    });

    it('eventService.fireEvent is called with null when userdata is reset', () => {
      const spy = spyOn(eventsService, 'fireEvent');
      userService.resetUserDataInStore();
      expect(spy).toHaveBeenCalledWith(EventTypes.userDataChanged, null);
    });
  });

  describe('publishUserdataIfExists', () => {
    it('do nothing if no userdata is stored', () => {
      spyOn(userService, 'getUserDataFromStore').and.returnValue('');
      const observableSpy = spyOn((userService as any).userDataInternal$, 'next');
      const eventSpy = spyOn(eventsService, 'fireEvent');
      userService.publishUserdataIfExists();
      expect(observableSpy).not.toHaveBeenCalled();
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('userDataInternal is fired if userdata exists', () => {
      spyOn(userService, 'getUserDataFromStore').and.returnValue('something');
      const observableSpy = spyOn((userService as any).userDataInternal$, 'next');
      userService.publishUserdataIfExists();
      expect(observableSpy).toHaveBeenCalledWith('something');
    });

    it('eventservice UserDataChanged is fired if userdata exists', () => {
      spyOn(userService, 'getUserDataFromStore').and.returnValue('something');
      const eventSpy = spyOn(eventsService, 'fireEvent');
      userService.publishUserdataIfExists();
      expect(eventSpy).toHaveBeenCalledWith(EventTypes.userDataChanged, 'something');
    });
  });

  describe('validateUserdataSubIdToken', () => {
    it('with no idTokenSub returns false', () => {
      const serviceAsAny = userService as any;
      const result = serviceAsAny.validateUserDataSubIdToken('', 'anything');
      expect(result).toBeFalse();
    });

    it('with no userdataSub returns false', () => {
      const serviceAsAny = userService as any;
      const result = serviceAsAny.validateUserDataSubIdToken('something', '');
      expect(result).toBeFalse();
    });

    it('with idTokenSub and userdataSub not match logs and returns false', () => {
      const serviceAsAny = userService as any;
      const loggerSpy = spyOn(loggerService, 'logDebug');
      const result = serviceAsAny.validateUserDataSubIdToken('something', 'something2');
      expect(result).toBeFalse();
      expect(loggerSpy).toHaveBeenCalledWith('validateUserDataSubIdToken failed', 'something', 'something2');
    });
  });

  describe('getIdentityUserData', () => {
    it(
      'does nothing if no authwellknownepdints are set',
      waitForAsync(() => {
        const serviceAsAny = userService as any;
        spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('accessToken');
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        serviceAsAny.getIdentityUserData().subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'does nothing if no userinfoEndpoint is set',
      waitForAsync(() => {
        const serviceAsAny = userService as any;
        spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('accessToken');
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ userinfoEndpoint: null });
        serviceAsAny.getIdentityUserData().subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'gets userdata if authwell and userinfoendpoint is set',
      waitForAsync(() => {
        const serviceAsAny = userService as any;
        const spy = spyOn(dataService, 'get').and.returnValue(of({}));
        spyOn(storagePersistanceService, 'getAccessToken').and.returnValue('accessToken');
        spyOn(storagePersistanceService, 'read')
          .withArgs('authWellKnownEndPoints')
          .and.returnValue({ userinfoEndpoint: 'userinfoEndpoint' });
        serviceAsAny.getIdentityUserData().subscribe(() => {
          expect(spy).toHaveBeenCalledWith('userinfoEndpoint', 'accessToken');
        });
      })
    );
  });
});
