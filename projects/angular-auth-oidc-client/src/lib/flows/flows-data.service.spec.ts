import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/services/logger.service';
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
    it('should create a nonce and store it', () => {
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
    it('should return the auth state control from the store', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockReturnValue(undefined);

      service.getAuthStateControl({ configId: 'configId1' });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('authStateControl', {
        configId: 'configId1',
      });
    });

    it('should return an empty auth state control without reading storage when config is null', () => {
      const spy = vi.spyOn(storagePersistenceService, 'read');
      const result = service.getAuthStateControl(null);

      expect(result).toBe('');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should return false from setAuthStateControl without writing storage when config is null', () => {
      const spy = vi.spyOn(storagePersistenceService, 'write');
      const result = service.setAuthStateControl('ToSave', null);

      expect(result).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should save the auth state control in the store', () => {
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
    it('should create and save a 40 char auth state control if nothing is stored', () => {
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
      expect(result.length).toBe(40);
      expect(setSpy).toHaveBeenCalledTimes(1);
      expect(setSpy).toHaveBeenCalledWith('authStateControl', result, {
        configId: 'configId1',
      });
    });

    it('should return the stored value and not store it again', () => {
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
    it('should save the session state in the storage', () => {
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
    it('should reset the flow data in the storage', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'resetStorageFlowData')
        .mockReturnValue(undefined);

      service.resetStorageFlowData({ configId: 'configId1' });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('codeVerifier', () => {
    it('should return the code verifier from the store', () => {
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

    it('should create a random code verifier and store it', () => {
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
    it('should check code flow is in progress and return result', () => {
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

    it('should return false when the state object does not exist', () => {
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
    it('should set setCodeFlowInProgress to `in progress` when called', () => {
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
    it('should set resetCodeFlowInProgress to false when called', () => {
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
    it('should return false when the stored entry parses to null', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'storageSilentRenewRunning') {
            return 'null';
          }

          return undefined;
        }
      );
      const spyWrite = vi.spyOn(storagePersistenceService, 'write');
      const result = service.isSilentRenewRunning({ configId: 'configId1' });

      expect(result).toBe(false);
      expect(spyWrite).not.toHaveBeenCalled();
    });

    it('should treat a running process as stuck and reset it when silentRenewTimeoutInSeconds is not set', () => {
      const config = { configId: 'configId1' };

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

      vi.advanceTimersByTime(1000);

      const result = service.isSilentRenewRunning(config);

      expect(result).toBe(false);
      expect(spyWrite).toHaveBeenCalledWith(
        'storageSilentRenewRunning',
        '',
        config
      );
    });

    it('should reset the state object and return false when the silent renew process timeout is exceeded', () => {
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

    it('should check silent renew process and return result', () => {
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

    it('should return false when the state object does not exist', () => {
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
    it('should set setSilentRenewRunning to `running` with lauched time when called', () => {
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
    it('should not write storage when config is null', () => {
      const spy = vi.spyOn(storagePersistenceService, 'write');

      service.resetSilentRenewRunning(null);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should set resetSilentRenewRunning to empty string when called', () => {
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
