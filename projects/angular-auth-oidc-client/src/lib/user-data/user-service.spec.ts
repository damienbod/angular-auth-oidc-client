import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { createRetriableStream } from '../../test/create-retriable-stream.helper';
import { DataService } from '../api/data.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/services/logger.service';
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
  let tokenHelperService: TokenHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(StoragePersistenceService),
        mockProvider(LoggerService),
        mockProvider(DataService),
        mockProvider(PlatformProvider),
        PublicEventsService,
        TokenHelperService,
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
    tokenHelperService = TestBed.inject(TokenHelperService);
  });

  it('should create', () => {
    expect(userService).toBeTruthy();
  });

  it('public userData$ is observable$', () => {
    expect(userService.userData$).toEqual(expect.any(Observable));
  });

  describe('getAndPersistUserDataInStore', () => {
    it('decodes the stored id token when no id token and decoded token are passed', async () => {
      const config = {
        responseType: 'notcode',
        configId: 'configId1',
      } as OpenIdConfiguration;
      const decodedFromStorage = { sub: 'storedSub' };

      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'storedIdToken'
      );
      const getPayloadSpy = vi
        .spyOn(tokenHelperService, 'getPayloadFromToken')
        .mockReturnValue(decodedFromStorage);
      const result = await firstValueFrom(
        userService.getAndPersistUserDataInStore(config, [config])
      );

      expect(getPayloadSpy).toHaveBeenCalledWith(
        'storedIdToken',
        false,
        config
      );
      expect(result).toBe(decodedFromStorage);
    });

    it('asks the server for user data even if data is stored when isRenewProcess is not passed', async () => {
      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'userDataInStore'
      );
      const spy = vi
        .spyOn(userService as any, 'getIdentityUserData')
        .mockReturnValue(of(DUMMY_USER_DATA));
      const result = await firstValueFrom(
        userService.getAndPersistUserDataInStore(
          config,
          [config],
          undefined,
          'idToken',
          { sub: DUMMY_USER_DATA.sub }
        )
      );

      expect(spy).toHaveBeenCalled();
      expect(result).toEqual(DUMMY_USER_DATA);
    });

    it('if not currentFlow is NOT id Token or Code flow, return decoded ID Token - passed as argument', async () => {
      const isRenewProcess = false;
      const idToken = '';
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = '';
      const config = {
        responseType: 'notcode',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        userDataInstore
      );

      const token = await firstValueFrom(
        userService.getAndPersistUserDataInStore(
          config,
          [config],
          isRenewProcess,
          idToken,
          decodedIdToken
        )
      );

      expect(decodedIdToken).toBe(token);
    });

    it('if not currentFlow is NOT id Token or Code flow, "setUserDataToStore" is called with the decodedIdToken', async () => {
      const isRenewProcess = false;
      const idToken = '';
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = '';
      const config = {
        responseType: 'notcode',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        userDataInstore
      );
      vi.spyOn(userService, 'setUserDataToStore').mockReturnValue(undefined);

      const token = await firstValueFrom(
        userService.getAndPersistUserDataInStore(
          config,
          [config],
          isRenewProcess,
          idToken,
          decodedIdToken
        )
      );

      expect(decodedIdToken).toBe(token);
      expect(userService.setUserDataToStore).toHaveBeenCalled();
    });

    it('if not currentFlow is id token or code flow with renewProcess going -> return existing data from storage', async () => {
      const isRenewProcess = true;
      const idToken = '';
      const decodedIdToken = 'decodedIdToken';
      const userDataInstore = 'userDataInstore';
      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        userDataInstore
      );

      const token = await firstValueFrom(
        userService.getAndPersistUserDataInStore(
          config,
          [config],
          isRenewProcess,
          idToken,
          decodedIdToken
        )
      );

      expect(userDataInstore).toBe(token);
    });

    it('if not currentFlow is id token or code flow and not renewProcess --> ask server for data', async () => {
      const isRenewProcess = false;
      const idToken = '';
      const decodedIdToken = { sub: DUMMY_USER_DATA.sub };
      const userDataInstore = '';
      const userDataFromSts = DUMMY_USER_DATA;
      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        userDataInstore
      );
      const spy = vi
        .spyOn(userService as any, 'getIdentityUserData')
        .mockReturnValue(of(userDataFromSts));
      const token = await firstValueFrom(
        userService.getAndPersistUserDataInStore(
          config,
          [config],
          isRenewProcess,
          idToken,
          decodedIdToken
        )
      );

      expect(userDataFromSts).toEqual(token);
      expect(spy).toHaveBeenCalled();
    });

    it(`if not currentFlow is id token or code flow and not renewprocess
          --> ask server for data
          --> logging if it has userdata`, async () => {
      const isRenewProcess = false;
      const idToken = '';
      const decodedIdToken = { sub: DUMMY_USER_DATA.sub };
      const userDataInstore = '';
      const userDataFromSts = DUMMY_USER_DATA;
      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        userDataInstore
      );
      const spy = vi
        .spyOn(userService as any, 'getIdentityUserData')
        .mockReturnValue(of(userDataFromSts));

      vi.spyOn(loggerService, 'logDebug').mockReturnValue(undefined);
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );

      const token = await firstValueFrom(
        userService.getAndPersistUserDataInStore(
          config,
          [config],
          isRenewProcess,
          idToken,
          decodedIdToken
        )
      );

      expect(userDataFromSts).toEqual(token);
      expect(spy).toHaveBeenCalled();
      expect(loggerService.logDebug).toHaveBeenCalled();
    });

    it(`if not currentFlow is id token or code flow and not renewprocess
          --> ask server for data
          --> throwing Error if it has no userdata `, async () => {
      const isRenewProcess = false;
      const idToken = '';
      const decodedIdToken = { sub: 'decodedIdToken' };
      const userDataInstore = '';
      const userDataFromSts = null;
      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        userDataInstore
      );
      const spyGetIdentityUserData = vi
        .spyOn(userService as any, 'getIdentityUserData')
        .mockReturnValue(of(userDataFromSts));

      vi.spyOn(loggerService, 'logDebug').mockReturnValue(undefined);
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );

      await expect(
        firstValueFrom(
          userService.getAndPersistUserDataInStore(
            config,
            [config],
            isRenewProcess,
            idToken,
            decodedIdToken
          )
        )
      ).rejects.toThrow('Received no user data, request failed');

      expect(spyGetIdentityUserData).toHaveBeenCalled();
    });

    it(`if not currentFlow is id token or code flow and renewprocess and renewUserInfoAfterTokenRenew
          --> ask server for data`, async () => {
      const isRenewProcess = true;
      const idToken = '';
      const decodedIdToken = { sub: DUMMY_USER_DATA.sub };
      const userDataInstore = 'userDataInStore';
      const userDataFromSts = DUMMY_USER_DATA;
      const config = {
        responseType: 'code',
        renewUserInfoAfterTokenRenew: true,
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        userDataInstore
      );
      const spy = vi
        .spyOn(userService as any, 'getIdentityUserData')
        .mockReturnValue(of(userDataFromSts));
      const token = await firstValueFrom(
        userService.getAndPersistUserDataInStore(
          config,
          [config],
          isRenewProcess,
          idToken,
          decodedIdToken
        )
      );

      expect(userDataFromSts).toEqual(token);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getUserDataFromStore', () => {
    it('returns null without reading storage when config is null', () => {
      const readSpy = vi.spyOn(storagePersistenceService, 'read');
      const result = userService.getUserDataFromStore(null);

      expect(result).toBeNull();
      expect(readSpy).not.toHaveBeenCalled();
    });

    it('returns null if there is not data', () => {
      const config = { configId: 'configId1' };
      const result = userService.getUserDataFromStore(config);

      expect(result).toBeNull();
    });

    it('returns value if there is data', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'userData') {
            return 'userData';
          }

          return undefined;
        }
      );
      const result = userService.getUserDataFromStore(config);

      expect(result).toBeTruthy();
    });
  });

  describe('setUserDataToStore', () => {
    it('publishes an empty configId when the single config has no configId', () => {
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      userService.setUserDataToStore('userData', {}, [{}]);

      expect(observableSpy).toHaveBeenCalledWith({
        userData: 'userData',
        allUserData: [{ configId: '', userData: 'userData' }],
      });
    });

    it('publishes null user data and an empty configId for other configs without stored data or configId', () => {
      const currentConfig = { configId: 'configId1' };
      const otherConfig = {};
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(undefined);

      userService.setUserDataToStore('userData', currentConfig, [
        currentConfig,
        otherConfig,
      ]);

      expect(observableSpy).toHaveBeenCalledWith({
        userData: null,
        allUserData: [
          { configId: 'configId1', userData: 'userData' },
          { configId: '', userData: null },
        ],
      });
    });

    it('publishes the passed user data for a current config without configId among multiple configs', () => {
      const currentConfig = {};
      const otherConfig = { configId: 'configId2' };
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(
        'staleUserData'
      );

      userService.setUserDataToStore('userData', currentConfig, [
        currentConfig,
        otherConfig,
      ]);

      expect(observableSpy).toHaveBeenCalledWith({
        userData: null,
        allUserData: [
          { configId: '', userData: 'userData' },
          { configId: 'configId2', userData: 'staleUserData' },
        ],
      });
    });

    it('does not publish the passed user data for another config that also has no configId', () => {
      const currentConfig = {};
      const otherConfigWithoutId = {};
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (key: string, config: any) =>
          key === 'userData' && config === otherConfigWithoutId
            ? 'otherUserData'
            : undefined
      );

      userService.setUserDataToStore('userData', currentConfig, [
        currentConfig,
        otherConfigWithoutId,
      ]);

      expect(observableSpy).toHaveBeenCalledWith({
        userData: null,
        allUserData: [
          { configId: '', userData: 'userData' },
          { configId: '', userData: 'otherUserData' },
        ],
      });
    });

    it('publishes the passed user data for a copy of the current config with the same configId', () => {
      const currentConfig = { configId: 'configId1' };
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(
        'staleUserData'
      );

      userService.setUserDataToStore('userData', currentConfig, [
        { ...currentConfig },
        { configId: 'configId2' },
      ]);

      expect(observableSpy).toHaveBeenCalledWith({
        userData: null,
        allUserData: [
          { configId: 'configId1', userData: 'userData' },
          { configId: 'configId2', userData: 'staleUserData' },
        ],
      });
    });

    it('sets userData in storagePersistenceService', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      userService.setUserDataToStore('userDataForTest', config, [config]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('userData', 'userDataForTest', config);
    });

    it('userDataInternal$ is called when userData is set', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      userService.setUserDataToStore('userDataForTest', config, [config]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
        userData: 'userDataForTest',
        allUserData: [{ configId: 'configId1', userData: 'userDataForTest' }],
      });
    });

    it('eventService.fireEvent is called when userData is set', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn(eventsService, 'fireEvent')
        .mockReturnValue(undefined);

      userService.setUserDataToStore('userDataForTest', config, [config]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(EventTypes.UserDataChanged, {
        configId: 'configId1',
        userData: 'userDataForTest',
      });
    });
  });

  describe('resetUserDataInStore', () => {
    it('resets userData sets null in storagePersistenceService', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn(storagePersistenceService, 'remove')
        .mockReturnValue(undefined);

      userService.resetUserDataInStore(config, [config]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('userData', config);
    });

    it('userDataInternal$ is called with null when userData is reset', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      userService.resetUserDataInStore(config, [config]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
        userData: null,
        allUserData: [{ configId: 'configId1', userData: null }],
      });
    });

    it('eventService.fireEvent is called with null when userData is reset', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn(eventsService, 'fireEvent')
        .mockReturnValue(undefined);

      userService.resetUserDataInStore(config, [config]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(EventTypes.UserDataChanged, {
        configId: 'configId1',
        userData: null,
      });
    });
  });

  describe('publishUserDataIfExists', () => {
    it('do nothing if no userData is stored', () => {
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue('');
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);
      const eventSpy = vi
        .spyOn(eventsService, 'fireEvent')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      userService.publishUserDataIfExists(config, [config]);

      expect(observableSpy).not.toHaveBeenCalled();
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('userDataInternal is fired if userData exists with single config', () => {
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'something'
      );
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      userService.publishUserDataIfExists(config, [config]);

      expect(observableSpy).toHaveBeenCalledTimes(1);

      expect(observableSpy).toHaveBeenCalledWith({
        userData: 'something',
        allUserData: [{ configId: 'configId1', userData: 'something' }],
      });
    });

    it('userDataInternal is fired if userData exists with multiple configs', () => {
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const observableSpy = vi
        .spyOn((userService as any).userDataInternal$, 'next')
        .mockReturnValue(undefined);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'userData' && args[1] === allConfigs[0]) {
            return 'somethingForConfig1';
          }

          if (args[0] === 'userData' && args[1] === allConfigs[1]) {
            return 'somethingForConfig2';
          }

          return undefined;
        }
      );

      userService.publishUserDataIfExists(allConfigs[0], allConfigs);

      expect(observableSpy).toHaveBeenCalledTimes(1);

      expect(observableSpy).toHaveBeenCalledWith({
        userData: null,
        allUserData: [
          { configId: 'configId1', userData: 'somethingForConfig1' },
          { configId: 'configId2', userData: 'somethingForConfig2' },
        ],
      });
    });

    it('event service UserDataChanged is fired if userData exists', () => {
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'something'
      );
      const eventSpy = vi
        .spyOn(eventsService, 'fireEvent')
        .mockReturnValue(undefined);

      userService.publishUserDataIfExists(allConfigs[0], allConfigs);

      expect(eventSpy).toHaveBeenCalledTimes(1);

      expect(eventSpy).toHaveBeenCalledWith(EventTypes.UserDataChanged, {
        configId: 'configId1',
        userData: 'something',
      });
    });
  });

  describe('validateUserDataSubIdToken', () => {
    it('with no idTokenSub returns false', () => {
      const serviceAsAny = userService as any;
      const config = { configId: 'configId1' };
      const result = serviceAsAny.validateUserDataSubIdToken(
        config,
        '',
        'anything'
      );

      expect(result).toBe(false);
    });

    it('with no userDataSub returns false', () => {
      const serviceAsAny = userService as any;
      const config = { configId: 'configId1' };
      const result = serviceAsAny.validateUserDataSubIdToken(
        config,
        'something',
        ''
      );

      expect(result).toBe(false);
    });

    it('with idTokenSub and userDataSub not match logs and returns false', () => {
      const serviceAsAny = userService as any;
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };
      const result = serviceAsAny.validateUserDataSubIdToken(
        config,
        'something',
        'something2'
      );

      expect(result).toBe(false);
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith(
        config,
        'validateUserDataSubIdToken failed',
        'something',
        'something2'
      );
    });
  });

  describe('getIdentityUserData', () => {
    it('does nothing if no authWellKnownEndPoints are set', async () => {
      const config = { configId: 'configId1' };
      const serviceAsAny = userService as any;

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );
      await expect(
        firstValueFrom(serviceAsAny.getIdentityUserData(config))
      ).rejects.toThrow('authWellKnownEndpoints is undefined');
    });

    it('does nothing if no userInfoEndpoint is set', async () => {
      const config = { configId: 'configId1' };
      const serviceAsAny = userService as any;

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { userInfoEndpoint: null };
          }

          return undefined;
        }
      );
      await expect(
        firstValueFrom(serviceAsAny.getIdentityUserData(config))
      ).rejects.toThrow(
        'authWellKnownEndpoints.userinfo_endpoint is undefined'
      );
    });

    it('gets userData if authwell and userInfoEndpoint is set', async () => {
      const config = { configId: 'configId1' };
      const serviceAsAny = userService as any;
      const spy = vi.spyOn(dataService, 'get').mockReturnValue(of({}));

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { userInfoEndpoint: 'userInfoEndpoint' };
          }

          return undefined;
        }
      );
      await firstValueFrom(serviceAsAny.getIdentityUserData(config));

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        'userInfoEndpoint',
        config,
        'accessToken'
      );
    });
  });

  it('should retry once', async () => {
    const config = { configId: 'configId1' };

    vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
      'accessToken'
    );
    vi.spyOn(storagePersistenceService, 'read').mockImplementation(
      (...args: any[]) => {
        if (args[0] === 'authWellKnownEndPoints') {
          return { userInfoEndpoint: 'userInfoEndpoint' };
        }

        return undefined;
      }
    );
    vi.spyOn(dataService, 'get').mockReturnValue(
      createRetriableStream(
        throwError(() => new Error('Error')),
        of(DUMMY_USER_DATA)
      )
    );

    const res = await firstValueFrom(
      (userService as any).getIdentityUserData(config)
    );

    expect(res).toBeTruthy();
    expect(res).toEqual(DUMMY_USER_DATA);
  });

  it('should retry twice', async () => {
    const config = { configId: 'configId1' };

    vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
      'accessToken'
    );
    vi.spyOn(storagePersistenceService, 'read').mockImplementation(
      (...args: any[]) => {
        if (args[0] === 'authWellKnownEndPoints') {
          return { userInfoEndpoint: 'userInfoEndpoint' };
        }

        return undefined;
      }
    );
    vi.spyOn(dataService, 'get').mockReturnValue(
      createRetriableStream(
        throwError(() => new Error('Error')),
        throwError(() => new Error('Error')),
        of(DUMMY_USER_DATA)
      )
    );

    const res = await firstValueFrom(
      (userService as any).getIdentityUserData(config)
    );

    expect(res).toBeTruthy();
    expect(res).toEqual(DUMMY_USER_DATA);
  });

  it('should fail after three tries', async () => {
    const config = { configId: 'configId1' };

    vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
      'accessToken'
    );
    vi.spyOn(storagePersistenceService, 'read').mockImplementation(
      (...args: any[]) => {
        if (args[0] === 'authWellKnownEndPoints') {
          return { userInfoEndpoint: 'userInfoEndpoint' };
        }

        return undefined;
      }
    );
    vi.spyOn(dataService, 'get').mockReturnValue(
      createRetriableStream(
        throwError(() => new Error('Error')),
        throwError(() => new Error('Error')),
        throwError(() => new Error('Error')),
        of(DUMMY_USER_DATA)
      )
    );

    await expect(
      firstValueFrom((userService as any).getIdentityUserData(config))
    ).rejects.toThrow('Error');
  });
});
