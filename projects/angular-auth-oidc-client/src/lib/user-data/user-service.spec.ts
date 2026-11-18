import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { skip } from 'rxjs/operators';
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
import { UserDataResult } from './userdata-result';

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

  function recordUserDataEmissions(): UserDataResult[] {
    const emissions: UserDataResult[] = [];

    userService.userData$
      .pipe(skip(1))
      .subscribe((value) => emissions.push(value));

    return emissions;
  }

  function mockAuthWellKnownEndPoints(authWellKnownEndPoints: any): void {
    vi.spyOn(storagePersistenceService, 'read').mockImplementation(
      (...args: any[]) => {
        if (args[0] === 'authWellKnownEndPoints') {
          return authWellKnownEndPoints;
        }

        return undefined;
      }
    );
  }

  function mockUserInfoResponse(
    response: Observable<any>
  ): MockInstance<DataService['get']> {
    mockAuthWellKnownEndPoints({ userInfoEndpoint: 'userInfoEndpoint' });

    return vi.spyOn(dataService, 'get').mockReturnValue(response);
  }

  function getUserDataFromServer(
    decodedIdToken: any = { sub: DUMMY_USER_DATA.sub }
  ): Promise<any> {
    const config = {
      responseType: 'code',
      configId: 'configId1',
    } as OpenIdConfiguration;

    return firstValueFrom(
      userService.getAndPersistUserDataInStore(
        config,
        [config],
        false,
        'idToken',
        decodedIdToken
      )
    );
  }

  it('should create', () => {
    expect(userService).toBeTruthy();
  });

  it('should expose userData$ as an observable', () => {
    expect(userService.userData$).toEqual(expect.any(Observable));
  });

  describe('getAndPersistUserDataInStore', () => {
    it('should decode the stored id token when no id token and decoded token are passed', async () => {
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

    it('should ask the server for user data even if data is stored when isRenewProcess is not passed', async () => {
      const config = {
        responseType: 'code',
        configId: 'configId1',
      } as OpenIdConfiguration;

      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'userDataInStore'
      );
      const spy = mockUserInfoResponse(of(DUMMY_USER_DATA));
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

    it('should return the decoded id token passed as argument if the current flow is not id token or code flow', async () => {
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

    it('should store the decoded id token as user data if the current flow is not id token or code flow', async () => {
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

    it('should return existing user data from storage during a renew process', async () => {
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

    it('should request user data from the server when not in a renew process', async () => {
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
      const spy = mockUserInfoResponse(of(userDataFromSts));
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

    it(`should request user data from the server and log it when not in a renew process`, async () => {
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
      const spy = mockUserInfoResponse(of(userDataFromSts));

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

    it(`should throw an error when the server returns no user data and not in a renew process`, async () => {
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
      const spyGetIdentityUserData = mockUserInfoResponse(of(userDataFromSts));

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

    it(`should request user data from the server during a renew process when renewUserInfoAfterTokenRenew is set`, async () => {
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
      const spy = mockUserInfoResponse(of(userDataFromSts));
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
    it('should return null without reading storage when config is null', () => {
      const readSpy = vi.spyOn(storagePersistenceService, 'read');
      const result = userService.getUserDataFromStore(null);

      expect(result).toBeNull();
      expect(readSpy).not.toHaveBeenCalled();
    });

    it('should return null if there is not data', () => {
      const config = { configId: 'configId1' };
      const result = userService.getUserDataFromStore(config);

      expect(result).toBeNull();
    });

    it('should return value if there is data', () => {
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
    it('should publish an empty configId when the single config has no configId', () => {
      const emissions = recordUserDataEmissions();

      userService.setUserDataToStore('userData', {}, [{}]);

      expect(emissions).toEqual([
        {
          userData: 'userData',
          allUserData: [{ configId: '', userData: 'userData' }],
        },
      ]);
    });

    it('should publish null user data and an empty configId for other configs without stored data or configId', () => {
      const currentConfig = { configId: 'configId1' };
      const otherConfig = {};
      const emissions = recordUserDataEmissions();

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(undefined);

      userService.setUserDataToStore('userData', currentConfig, [
        currentConfig,
        otherConfig,
      ]);

      expect(emissions).toEqual([
        {
          userData: null,
          allUserData: [
            { configId: 'configId1', userData: 'userData' },
            { configId: '', userData: null },
          ],
        },
      ]);
    });

    it('should publish the passed user data for a current config without configId among multiple configs', () => {
      // Arrange
      const currentConfig = {};
      const otherConfig = { configId: 'configId2' };
      const emissions = recordUserDataEmissions();

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(
        'staleUserData'
      );

      // Act
      userService.setUserDataToStore('userData', currentConfig, [
        currentConfig,
        otherConfig,
      ]);

      // Assert
      expect(emissions).toEqual([
        {
          userData: null,
          allUserData: [
            { configId: '', userData: 'userData' },
            { configId: 'configId2', userData: 'staleUserData' },
          ],
        },
      ]);
    });

    it('should not publish the passed user data for another config that also has no configId', () => {
      // Arrange
      const currentConfig = {};
      const otherConfigWithoutId = {};
      const emissions = recordUserDataEmissions();

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (key: string, config: any) =>
          key === 'userData' && config === otherConfigWithoutId
            ? 'otherUserData'
            : undefined
      );

      // Act
      userService.setUserDataToStore('userData', currentConfig, [
        currentConfig,
        otherConfigWithoutId,
      ]);

      // Assert
      expect(emissions).toEqual([
        {
          userData: null,
          allUserData: [
            { configId: '', userData: 'userData' },
            { configId: '', userData: 'otherUserData' },
          ],
        },
      ]);
    });

    it('should publish the passed user data for a copy of the current config with the same configId', () => {
      // Arrange
      const currentConfig = { configId: 'configId1' };
      const emissions = recordUserDataEmissions();

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(
        'staleUserData'
      );

      // Act
      userService.setUserDataToStore('userData', currentConfig, [
        { ...currentConfig },
        { configId: 'configId2' },
      ]);

      // Assert
      expect(emissions).toEqual([
        {
          userData: null,
          allUserData: [
            { configId: 'configId1', userData: 'userData' },
            { configId: 'configId2', userData: 'staleUserData' },
          ],
        },
      ]);
    });

    it('should set userData in storagePersistenceService', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      userService.setUserDataToStore('userDataForTest', config, [config]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('userData', 'userDataForTest', config);
    });

    it('should emit the user data when it is set', () => {
      const config = { configId: 'configId1' };
      const emissions = recordUserDataEmissions();

      userService.setUserDataToStore('userDataForTest', config, [config]);

      expect(emissions).toEqual([
        {
          userData: 'userDataForTest',
          allUserData: [{ configId: 'configId1', userData: 'userDataForTest' }],
        },
      ]);
    });

    it('should fire an event when user data is set', () => {
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
    it('should reset userData sets null in storagePersistenceService', () => {
      const config = { configId: 'configId1' };
      const spy = vi
        .spyOn(storagePersistenceService, 'remove')
        .mockReturnValue(undefined);

      userService.resetUserDataInStore(config, [config]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('userData', config);
    });

    it('should emit null when user data is reset', () => {
      const config = { configId: 'configId1' };
      const emissions = recordUserDataEmissions();

      userService.resetUserDataInStore(config, [config]);

      expect(emissions).toEqual([
        {
          userData: null,
          allUserData: [{ configId: 'configId1', userData: null }],
        },
      ]);
    });

    it('should fire an event with null when user data is reset', () => {
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
    it('should do nothing if no userData is stored', () => {
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue('');
      const emissions = recordUserDataEmissions();
      const eventSpy = vi
        .spyOn(eventsService, 'fireEvent')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      userService.publishUserDataIfExists(config, [config]);

      expect(emissions).toEqual([]);
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should emit user data if it exists with a single config', () => {
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue(
        'something'
      );
      const config = { configId: 'configId1' };
      const emissions = recordUserDataEmissions();

      userService.publishUserDataIfExists(config, [config]);

      expect(emissions).toEqual([
        {
          userData: 'something',
          allUserData: [{ configId: 'configId1', userData: 'something' }],
        },
      ]);
    });

    it('should emit user data if it exists with multiple configs', () => {
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const emissions = recordUserDataEmissions();

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

      expect(emissions).toEqual([
        {
          userData: null,
          allUserData: [
            { configId: 'configId1', userData: 'somethingForConfig1' },
            { configId: 'configId2', userData: 'somethingForConfig2' },
          ],
        },
      ]);
    });

    it('should fire UserDataChanged if user data exists', () => {
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

  describe('user data sub validation', () => {
    it('should reject user data from the server when the id token has no sub', async () => {
      mockUserInfoResponse(of(DUMMY_USER_DATA));
      const removeSpy = vi.spyOn(storagePersistenceService, 'remove');

      await expect(getUserDataFromServer({ sub: '' })).rejects.toThrow(
        'Received no user data, request failed'
      );
      expect(removeSpy).toHaveBeenCalledWith('userData', expect.anything());
    });

    it('should reject user data from the server when it has no sub', async () => {
      mockUserInfoResponse(of({ ...DUMMY_USER_DATA, sub: '' }));
      const removeSpy = vi.spyOn(storagePersistenceService, 'remove');

      await expect(getUserDataFromServer()).rejects.toThrow(
        'Received no user data, request failed'
      );
      expect(removeSpy).toHaveBeenCalledWith('userData', expect.anything());
    });

    it('should log, warn and reset user data when the id token sub and user data sub do not match', async () => {
      mockUserInfoResponse(of({ ...DUMMY_USER_DATA, sub: 'something2' }));
      const debugSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);
      const warningSpy = vi
        .spyOn(loggerService, 'logWarning')
        .mockReturnValue(undefined);
      const removeSpy = vi.spyOn(storagePersistenceService, 'remove');
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');

      await expect(getUserDataFromServer({ sub: 'something' })).rejects.toThrow(
        'Received no user data, request failed'
      );

      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({ configId: 'configId1' }),
        'validateUserDataSubIdToken failed',
        'something',
        'something2'
      );
      expect(warningSpy).toHaveBeenCalledWith(
        expect.objectContaining({ configId: 'configId1' }),
        'User data sub does not match sub in id_token, resetting'
      );
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('should store user data from the server when the subs match', async () => {
      mockUserInfoResponse(of(DUMMY_USER_DATA));
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');
      const result = await getUserDataFromServer();

      expect(result).toEqual(DUMMY_USER_DATA);
      expect(writeSpy).toHaveBeenCalledWith(
        'userData',
        DUMMY_USER_DATA,
        expect.objectContaining({ configId: 'configId1' })
      );
    });
  });

  describe('requesting user data from the server', () => {
    it('should throw if no authWellKnownEndPoints are set', async () => {
      const spy = vi.spyOn(dataService, 'get');

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );
      mockAuthWellKnownEndPoints(null);

      await expect(getUserDataFromServer()).rejects.toThrow(
        'authWellKnownEndpoints is undefined'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw if no userInfoEndpoint is set', async () => {
      const spy = vi.spyOn(dataService, 'get');

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );
      mockAuthWellKnownEndPoints({ userInfoEndpoint: null });

      await expect(getUserDataFromServer()).rejects.toThrow(
        'authWellKnownEndpoints.userinfo_endpoint is undefined'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should get userData if authwell and userInfoEndpoint is set', async () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'accessToken'
      );
      const spy = mockUserInfoResponse(of(DUMMY_USER_DATA));

      await getUserDataFromServer();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        'userInfoEndpoint',
        expect.objectContaining({ configId: 'configId1' }),
        'accessToken'
      );
    });

    it('should retry once', async () => {
      mockUserInfoResponse(
        createRetriableStream(
          throwError(() => new Error('Error')),
          of(DUMMY_USER_DATA)
        )
      );

      const res = await getUserDataFromServer();

      expect(res).toEqual(DUMMY_USER_DATA);
    });

    it('should retry twice', async () => {
      mockUserInfoResponse(
        createRetriableStream(
          throwError(() => new Error('Error')),
          throwError(() => new Error('Error')),
          of(DUMMY_USER_DATA)
        )
      );

      const res = await getUserDataFromServer();

      expect(res).toEqual(DUMMY_USER_DATA);
    });

    it('should fail after three tries', async () => {
      mockUserInfoResponse(
        createRetriableStream(
          throwError(() => new Error('Error')),
          throwError(() => new Error('Error')),
          throwError(() => new Error('Error')),
          of(DUMMY_USER_DATA)
        )
      );

      await expect(getUserDataFromServer()).rejects.toThrow('Error');
    });
  });
});
