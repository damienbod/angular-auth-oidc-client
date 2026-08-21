import { TestBed } from '@angular/core/testing';
import { mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { CryptoService } from '../utils/crypto/crypto.service';
import { FlowsDataService } from './flows-data.service';
import { RandomService } from './random/random.service';

describe('Flows Data Service', () => {
  let service: FlowsDataService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FlowsDataService,
        RandomService,
        CryptoService,
        mockProvider(LoggerService),
        mockProvider(StoragePersistenceService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(FlowsDataService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('createNonce', () => {
    it('createNonce returns nonce and stores it', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const result = service.createNonce({ configId: 'configId1' });

      expect(result).toBeTruthy();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('authNonce', result, {
        configId: 'configId1',
      });
    });
  });

  describe('AuthStateControl', () => {
    it('getAuthStateControl returns property from store', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockReturnValue(undefined);

      service.getAuthStateControl({ configId: 'configId1' });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('authStateControl', {
        configId: 'configId1',
      });
    });

    it('setAuthStateControl saves property in store', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      service.setAuthStateControl('ToSave', { configId: 'configId1' });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('authStateControl', 'ToSave', {
        configId: 'configId1',
      });
    });
  });

  describe('getExistingOrCreateAuthStateControl', () => {
    it('if nothing stored it creates a 40 char one and saves the authStateControl', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authStateControl') {
            return null;
          }

          return undefined;
        }
      );
      const setSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const result = service.getExistingOrCreateAuthStateControl({
        configId: 'configId1',
      });

      expect(result).toBeTruthy();
      expect(result.length).toBe(41);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith('authStateControl', result, {
        configId: 'configId1',
      });
    });

    it('if stored it returns the value and does NOT Store the value again', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authStateControl') {
            return 'someAuthStateControl';
          }

          return undefined;
        }
      );
      const setSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const result = service.getExistingOrCreateAuthStateControl({
        configId: 'configId1',
      });

      expect(result).toEqual('someAuthStateControl');
      expect(result.length).toBe('someAuthStateControl'.length);
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('setSessionState', () => {
    it('setSessionState saves the value in the storage', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      service.setSessionState('Genesis', { configId: 'configId1' });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('session_state', 'Genesis', {
        configId: 'configId1',
      });
    });
  });

  describe('resetStorageFlowData', () => {
    it('resetStorageFlowData calls correct method on storagePersistenceService', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'resetStorageFlowData')
        .mockReturnValue(undefined);

      service.resetStorageFlowData({ configId: 'configId1' });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('codeVerifier', () => {
    it('getCodeVerifier returns value from the store', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockImplementation((...args: any[]) => {
          if (args[0] === 'codeVerifier') {
            return 'Genesis';
          }

          return undefined;
        });
      const result = service.getCodeVerifier({ configId: 'configId1' });

      expect(result).toBe('Genesis');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('codeVerifier', {
        configId: 'configId1',
      });
    });

    it('createCodeVerifier returns random createCodeVerifier and stores it', () => {
      const setSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const result = service.createCodeVerifier({ configId: 'configId1' });

      expect(result).toBeTruthy();
      expect(result.length).toBe(67);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith('codeVerifier', result, {
        configId: 'configId1',
      });
    });
  });

  describe('isCodeFlowInProgress', () => {
    it('checks code flow is in progress and returns result', () => {
      const config = {
        configId: 'configId1',
      };

      vi.useRealTimers();
      vi.useFakeTimers();
      const baseTime = new Date();

      vi.setSystemTime(baseTime);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'storageCodeFlowInProgress') {
            return true;
          }

          return undefined;
        }
      );
      const spyWrite = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const isCodeFlowInProgressResult = service.isCodeFlowInProgress(config);

      expect(spyWrite).not.toHaveBeenCalled();
      expect(isCodeFlowInProgressResult).toBe(true);
    });

    it('state object does not exist returns false result', () => {
      // arrange
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'storageCodeFlowInProgress') {
            return null;
          }

          return undefined;
        }
      );

      // act
      const isCodeFlowInProgressResult = service.isCodeFlowInProgress({
        configId: 'configId1',
      });

      // assert
      expect(isCodeFlowInProgressResult).toBe(false);
    });
  });

  describe('setCodeFlowInProgress', () => {
    it('set setCodeFlowInProgress to `in progress` when called', () => {
      vi.useRealTimers();
      vi.useFakeTimers();
      const baseTime = new Date();

      vi.setSystemTime(baseTime);

      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      service.setCodeFlowInProgress({ configId: 'configId1' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('storageCodeFlowInProgress', true, {
        configId: 'configId1',
      });
    });
  });

  describe('resetCodeFlowInProgress', () => {
    it('set resetCodeFlowInProgress to false when called', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      service.resetCodeFlowInProgress({ configId: 'configId1' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('storageCodeFlowInProgress', false, {
        configId: 'configId1',
      });
    });
  });

  describe('isSilentRenewRunning', () => {
    it('silent renew process timeout exceeded reset state object and returns false result', () => {
      const config = {
        silentRenewTimeoutInSeconds: 10,
        configId: 'configId1',
      };

      vi.useRealTimers();
      vi.useFakeTimers();
      const baseTime = new Date();

      vi.setSystemTime(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'storageSilentRenewRunning') {
            return JSON.stringify(storageObject);
          }

          return undefined;
        }
      );
      const spyWrite = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      vi.advanceTimersByTime((config.silentRenewTimeoutInSeconds + 1) * 1000);

      const isSilentRenewRunningResult = service.isSilentRenewRunning(config);

      expect(spyWrite).toHaveBeenCalledTimes(1);

      expect(spyWrite).toHaveBeenCalledWith(
        'storageSilentRenewRunning',
        '',
        config
      );
      expect(isSilentRenewRunningResult).toBe(false);
    });

    it('checks silent renew process and returns result', () => {
      const config = {
        silentRenewTimeoutInSeconds: 10,
        configId: 'configId1',
      };

      vi.useRealTimers();
      vi.useFakeTimers();
      const baseTime = new Date();

      vi.setSystemTime(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'storageSilentRenewRunning') {
            return JSON.stringify(storageObject);
          }

          return undefined;
        }
      );
      const spyWrite = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const isSilentRenewRunningResult = service.isSilentRenewRunning(config);

      expect(spyWrite).not.toHaveBeenCalled();
      expect(isSilentRenewRunningResult).toBe(true);
    });

    it('state object does not exist returns false result', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'storageSilentRenewRunning') {
            return null;
          }

          return undefined;
        }
      );

      const isSilentRenewRunningResult = service.isSilentRenewRunning({
        configId: 'configId1',
      });

      expect(isSilentRenewRunningResult).toBe(false);
    });
  });

  describe('setSilentRenewRunning', () => {
    it('set setSilentRenewRunning to `running` with lauched time when called', () => {
      vi.useRealTimers();
      vi.useFakeTimers();
      const baseTime = new Date();

      vi.setSystemTime(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      service.setSilentRenewRunning({ configId: 'configId1' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        'storageSilentRenewRunning',
        JSON.stringify(storageObject),
        { configId: 'configId1' }
      );
    });
  });

  describe('resetSilentRenewRunning', () => {
    it('set resetSilentRenewRunning to empty string when called', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      service.resetSilentRenewRunning({ configId: 'configId1' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('storageSilentRenewRunning', '', {
        configId: 'configId1',
      });
    });
  });
});
