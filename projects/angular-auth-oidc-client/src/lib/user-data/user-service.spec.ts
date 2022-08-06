import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
import { createRetriableStream } from '../../test/create-retriable-stream.helper';
import { DataService } from '../api/data.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { TokenHelperService } from '../utils/tokenHelper/token-helper.service';
import { UserService } from './user.service';

const DUMMY_USER_DATA = {
  sub: 'a5461470-33eb-4b2d-82d4-b0484e96ad7f',
  preferred_username: 'john@test.com',
  organization: 'testing',
};

describe('User Service', () => {
  let loggerService: LoggerService;
  let userService: UserService;
  let storagePersistenceService: StoragePersistenceService;
  let eventsService: PublicEventsService;
  let dataService: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: StoragePersistenceService,
          useClass: mockClass(StoragePersistenceService),
        },
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: DataService, useClass: mockClass(DataService) },
        { provide: PlatformProvider, useClass: mockClass(PlatformProvider) },
        PublicEventsService,
        TokenHelperService,
        UserService,
        FlowHelper,
      ],
    });
  });

  beforeEach(() => {
    loggerService = TestBed.inject(LoggerService);
    userService = TestBed.inject(UserService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
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
    it('if not currentFlow is NOT id Token or Code flow, return decoded ID Token - passed as argument', waitForAsync(() => {
      const isRenewProcess = false;
      const idToken = false;
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = '';

      const config = {
        responseType: 'notcode',
        configId: 'configId1',
      } as OpenIdConfiguration;

      spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);

      userService.getAndPersistUserDataInStore(config, [config], isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
        expect(decodedIdToken).toBe(token);
      });
    }));

    it('if not currentFlow is NOT id Token or Code flow, "setUserDataToStore" is called with the decodedIdToken', waitForAsync(() => {
      const isRenewProcess = false;
      const idToken = false;
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = '';

      const config = {
        responseType: 'notcode',
        configId: 'configId1',
      } as OpenIdConfiguration;

      spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
      spyOn(userService, 'setUserDataToStore');

      userService.getAndPersistUserDataInStore(config, [config], isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
        expect(decodedIdToken).toBe(token);
      });

      expect(userService.setUserDataToStore).toHaveBeenCalled();
    }));

    it('if not currentFlow is id token or code flow with renewProcess going -> return existing data from storage', waitForAsync(() => {
      const isRenewProcess = true;
      const idToken = false;
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = 'userDataInstore';

      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);

      userService.getAndPersistUserDataInStore(config, [config], isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
        expect(userDataInstore).toBe(token);
      });
    }));

    it('if not currentFlow is id token or code flow and not renewProcess --> ask server for data', waitForAsync(() => {
      const isRenewProcess = false;
      const idToken = false;
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = '';
      const userDataFromSts = 'userDataFromSts';

      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
      const spy = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));

      userService.getAndPersistUserDataInStore(config, [config], isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
        expect(userDataFromSts).toEqual(token);
      });

      expect(spy).toHaveBeenCalled();
    }));

    it(`if not currentFlow is id token or code flow and not renewprocess
          --> ask server for data
          --> logging if it has userdata`, waitForAsync(() => {
      const isRenewProcess = false;
      const idToken = false;
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = '';
      const userDataFromSts = 'userDataFromSts';

      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
      const spy = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));

      spyOn(loggerService, 'logDebug');
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');

      userService.getAndPersistUserDataInStore(config, [config], isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
        expect(userDataFromSts).toEqual(token);
      });

      expect(spy).toHaveBeenCalled();
      expect(loggerService.logDebug).toHaveBeenCalled();
    }));

    it(`if not currentFlow is id token or code flow and not renewprocess
          --> ask server for data
          --> throwing Error if it has no userdata `, waitForAsync(() => {
      const isRenewProcess = false;
      const idToken = false;
      const decodedIdToken = { sub: 'decodedIdToken' };
      const userDataInstore = '';
      const userDataFromSts = null;

      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
      const spyGetIdentityUserData = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));

      spyOn(loggerService, 'logDebug');
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');

      userService.getAndPersistUserDataInStore(config, [config], isRenewProcess, idToken, decodedIdToken).subscribe({
        error: (err) => {
          expect(err.message).toEqual('Received no user data, request failed');
        },
      });

      expect(spyGetIdentityUserData).toHaveBeenCalled();
    }));

    it(`if not currentFlow is id token or code flow and renewprocess and renewUserInfoAfterTokenRenew
          --> ask server for data`, waitForAsync(() => {
      const isRenewProcess = true;
      const idToken = false;
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = 'userDataInStore';
      const userDataFromSts = 'userDataFromSts';

      const config = {
        responseType: 'code',
        renewUserInfoAfterTokenRenew: true,
        configId: 'configId1',
      } as OpenIdConfiguration;

      spyOn(userService, 'getUserDataFromStore').and.returnValue(userDataInstore);
      const spy = spyOn(userService as any, 'getIdentityUserData').and.returnValue(of(userDataFromSts));

      userService.getAndPersistUserDataInStore(config, [config], isRenewProcess, idToken, decodedIdToken).subscribe((token) => {
        expect(userDataFromSts).toEqual(token);
      });

      expect(spy).toHaveBeenCalled();
    }));
  });

  describe('getUserDataFromStore', () => {
    it('returns null if there is not data', () => {
      const config = { configId: 'configId1' };
      const result = userService.getUserDataFromStore(config);

      expect(result).toBeNull();
    });

    it('returns value if there is data', () => {
      const config = { configId: 'configId1' };

      spyOn(storagePersistenceService, 'read').withArgs('userData', config).and.returnValue('userData');
      const result = userService.getUserDataFromStore(config);

      expect(result).toBeTruthy();
    });
  });

  describe('setUserDataToStore', () => {
    it('sets userData in storagePersistenceService', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn(storagePersistenceService, 'write');

      userService.setUserDataToStore('userDataForTest', config, [config]);
      expect(spy).toHaveBeenCalledOnceWith('userData', 'userDataForTest', config);
    });

    it('userDataInternal$ is called when userData is set', () => {
      const config = { configId: 'configId1' };

      const spy = spyOn((userService as any).userDataInternal$, 'next');

      userService.setUserDataToStore('userDataForTest', config, [config]);

      expect(spy).toHaveBeenCalledOnceWith({
        userData: 'userDataForTest',
        allUserData: [{ configId: 'configId1', userData: 'userDataForTest' }],
      });
    });

    it('eventService.fireEvent is called when userData is set', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn(eventsService, 'fireEvent');

      userService.setUserDataToStore('userDataForTest', config, [config]);

      expect(spy).toHaveBeenCalledOnceWith(EventTypes.UserDataChanged, { configId: 'configId1', userData: 'userDataForTest' });
    });
  });

  describe('resetUserDataInStore', () => {
    it('resets userData sets null in storagePersistenceService', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn(storagePersistenceService, 'remove');

      userService.resetUserDataInStore(config, [config]);

      expect(spy).toHaveBeenCalledOnceWith('userData', config);
    });

    it('userDataInternal$ is called with null when userData is reset', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn((userService as any).userDataInternal$, 'next');

      userService.resetUserDataInStore(config, [config]);

      expect(spy).toHaveBeenCalledOnceWith({
        userData: null,
        allUserData: [{ configId: 'configId1', userData: null }],
      });
    });

    it('eventService.fireEvent is called with null when userData is reset', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn(eventsService, 'fireEvent');

      userService.resetUserDataInStore(config, [config]);

      expect(spy).toHaveBeenCalledOnceWith(EventTypes.UserDataChanged, { configId: 'configId1', userData: null });
    });
  });

  describe('publishUserDataIfExists', () => {
    it('do nothing if no userData is stored', () => {
      spyOn(userService, 'getUserDataFromStore').and.returnValue('');
      const observableSpy = spyOn((userService as any).userDataInternal$, 'next');
      const eventSpy = spyOn(eventsService, 'fireEvent');
      const config = { configId: 'configId1' };

      userService.publishUserDataIfExists(config, [config]);

      expect(observableSpy).not.toHaveBeenCalled();
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('userDataInternal is fired if userData exists with single config', () => {
      spyOn(userService, 'getUserDataFromStore').and.returnValue('something');
      const observableSpy = spyOn((userService as any).userDataInternal$, 'next');
      const config = { configId: 'configId1' };

      userService.publishUserDataIfExists(config, [config]);

      expect(observableSpy).toHaveBeenCalledOnceWith({
        userData: 'something',
        allUserData: [{ configId: 'configId1', userData: 'something' }],
      });
    });

    it('userDataInternal is fired if userData exists with multiple configs', () => {
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const observableSpy = spyOn((userService as any).userDataInternal$, 'next');

      spyOn(storagePersistenceService, 'read')
        .withArgs('userData', allConfigs[0])
        .and.returnValue('somethingForConfig1')
        .withArgs('userData', allConfigs[1])
        .and.returnValue('somethingForConfig2');

      userService.publishUserDataIfExists(allConfigs[0], allConfigs);

      expect(observableSpy).toHaveBeenCalledOnceWith({
        userData: null,
        allUserData: [
          { configId: 'configId1', userData: 'somethingForConfig1' },
          { configId: 'configId2', userData: 'somethingForConfig2' },
        ],
      });
    });

    it('event service UserDataChanged is fired if userData exists', () => {
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];

      spyOn(userService, 'getUserDataFromStore').and.returnValue('something');
      const eventSpy = spyOn(eventsService, 'fireEvent');

      userService.publishUserDataIfExists(allConfigs[0], allConfigs);

      expect(eventSpy).toHaveBeenCalledOnceWith(EventTypes.UserDataChanged, { configId: 'configId1', userData: 'something' });
    });
  });

  describe('validateUserDataSubIdToken', () => {
    it('with no idTokenSub returns false', () => {
      const serviceAsAny = userService as any;
      const config = { configId: 'configId1' };

      const result = serviceAsAny.validateUserDataSubIdToken(config, '', 'anything');

      expect(result).toBeFalse();
    });

    it('with no userDataSub returns false', () => {
      const serviceAsAny = userService as any;
      const config = { configId: 'configId1' };

      const result = serviceAsAny.validateUserDataSubIdToken(config, 'something', '');

      expect(result).toBeFalse();
    });

    it('with idTokenSub and userDataSub not match logs and returns false', () => {
      const serviceAsAny = userService as any;
      const loggerSpy = spyOn(loggerService, 'logDebug');
      const config = { configId: 'configId1' };

      const result = serviceAsAny.validateUserDataSubIdToken(config, 'something', 'something2');

      expect(result).toBeFalse();
      expect(loggerSpy).toHaveBeenCalledOnceWith(config, 'validateUserDataSubIdToken failed', 'something', 'something2');
    });
  });

  describe('getIdentityUserData', () => {
    it('does nothing if no authWellKnownEndPoints are set', waitForAsync(() => {
      const config = { configId: 'configId1' };
      const serviceAsAny = userService as any;

      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue(null);
      serviceAsAny.getIdentityUserData(config).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
    }));

    it('does nothing if no userInfoEndpoint is set', waitForAsync(() => {
      const config = { configId: 'configId1' };
      const serviceAsAny = userService as any;

      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ userInfoEndpoint: null });
      serviceAsAny.getIdentityUserData(config).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
    }));

    it('gets userData if authwell and userInfoEndpoint is set', waitForAsync(() => {
      const config = { configId: 'configId1' };
      const serviceAsAny = userService as any;
      const spy = spyOn(dataService, 'get').and.returnValue(of({}));

      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');
      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue({ userInfoEndpoint: 'userInfoEndpoint' });
      serviceAsAny.getIdentityUserData(config).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('userInfoEndpoint', config, 'accessToken');
      });
    }));
  });

  it('should retry once', waitForAsync(() => {
    const config = { configId: 'configId1' };

    spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');
    spyOn(storagePersistenceService, 'read')
      .withArgs('authWellKnownEndPoints', config)
      .and.returnValue({ userInfoEndpoint: 'userInfoEndpoint' });
    spyOn(dataService, 'get').and.returnValue(
      createRetriableStream(
        throwError(() => new Error('Error')),
        of(DUMMY_USER_DATA)
      )
    );

    (userService as any).getIdentityUserData(config).subscribe({
      next: (res) => {
        expect(res).toBeTruthy();
        expect(res).toEqual(DUMMY_USER_DATA);
      },
    });
  }));

  it('should retry twice', waitForAsync(() => {
    const config = { configId: 'configId1' };

    spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');
    spyOn(storagePersistenceService, 'read')
      .withArgs('authWellKnownEndPoints', config)
      .and.returnValue({ userInfoEndpoint: 'userInfoEndpoint' });
    spyOn(dataService, 'get').and.returnValue(
      createRetriableStream(
        throwError(() => new Error('Error')),
        throwError(() => new Error('Error')),
        of(DUMMY_USER_DATA)
      )
    );

    (userService as any).getIdentityUserData(config).subscribe({
      next: (res) => {
        expect(res).toBeTruthy();
        expect(res).toEqual(DUMMY_USER_DATA);
      },
    });
  }));

  it('should fail after three tries', waitForAsync(() => {
    const config = { configId: 'configId1' };

    spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('accessToken');
    spyOn(storagePersistenceService, 'read')
      .withArgs('authWellKnownEndPoints', config)
      .and.returnValue({ userInfoEndpoint: 'userInfoEndpoint' });
    spyOn(dataService, 'get').and.returnValue(
      createRetriableStream(
        throwError(() => new Error('Error')),
        throwError(() => new Error('Error')),
        throwError(() => new Error('Error')),
        of(DUMMY_USER_DATA)
      )
    );

    (userService as any).getIdentityUserData(config).subscribe({
      error: (err) => {
        expect(err).toBeTruthy();
      },
    });
  }));
});
