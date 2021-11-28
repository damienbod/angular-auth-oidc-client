import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
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
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(FlowsDataService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('createNonce', () => {
    it('createNonce returns nonce and stores it', () => {
      const spy = spyOn(storagePersistenceService, 'write');

      const result = service.createNonce({ configId: 'configId1' });

      expect(result).toBeTruthy();
      expect(spy).toHaveBeenCalledWith('authNonce', result, { configId: 'configId1' });
    });
  });

  describe('AuthStateControl', () => {
    it('getAuthStateControl returns property from store', () => {
      const spy = spyOn(storagePersistenceService, 'read');

      service.getAuthStateControl({ configId: 'configId1' });

      expect(spy).toHaveBeenCalledWith('authStateControl', { configId: 'configId1' });
    });

    it('setAuthStateControl saves property in store', () => {
      const spy = spyOn(storagePersistenceService, 'write');

      service.setAuthStateControl('ToSave', { configId: 'configId1' });

      expect(spy).toHaveBeenCalledWith('authStateControl', 'ToSave', { configId: 'configId1' });
    });
  });

  describe('getExistingOrCreateAuthStateControl', () => {
    it('if nothing stored it creates a 40 char one and saves the authStateControl', () => {
      spyOn(storagePersistenceService, 'read').withArgs('authStateControl', { configId: 'configId1' }).and.returnValue(null);
      const setSpy = spyOn(storagePersistenceService, 'write');

      const result = service.getExistingOrCreateAuthStateControl({ configId: 'configId1' });

      expect(result).toBeTruthy();
      expect(result.length).toBe(41);
      expect(setSpy).toHaveBeenCalledWith('authStateControl', result, { configId: 'configId1' });
    });

    it('if stored it returns the value and does NOT Store the value again', () => {
      spyOn(storagePersistenceService, 'read')
        .withArgs('authStateControl', { configId: 'configId1' })
        .and.returnValue('someAuthStateControl');
      const setSpy = spyOn(storagePersistenceService, 'write');

      const result = service.getExistingOrCreateAuthStateControl({ configId: 'configId1' });

      expect(result).toEqual('someAuthStateControl');
      expect(result.length).toBe('someAuthStateControl'.length);
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('setSessionState', () => {
    it('setSessionState saves the value in the storage', () => {
      const spy = spyOn(storagePersistenceService, 'write');

      service.setSessionState('Genesis', { configId: 'configId1' });

      expect(spy).toHaveBeenCalledWith('session_state', 'Genesis', { configId: 'configId1' });
    });
  });

  describe('resetStorageFlowData', () => {
    it('resetStorageFlowData calls correct method on storagePersistenceService', () => {
      const spy = spyOn(storagePersistenceService, 'resetStorageFlowData');

      service.resetStorageFlowData({ configId: 'configId1' });

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('codeVerifier', () => {
    it('getCodeVerifier returns value from the store', () => {
      const spy = spyOn(storagePersistenceService, 'read').withArgs('codeVerifier', { configId: 'configId1' }).and.returnValue('Genesis');

      const result = service.getCodeVerifier({ configId: 'configId1' });

      expect(result).toBe('Genesis');
      expect(spy).toHaveBeenCalledWith('codeVerifier', { configId: 'configId1' });
    });

    it('createCodeVerifier returns random createCodeVerifier and stores it', () => {
      const setSpy = spyOn(storagePersistenceService, 'write');

      const result = service.createCodeVerifier({ configId: 'configId1' });

      expect(result).toBeTruthy();
      expect(result.length).toBe(67);
      expect(setSpy).toHaveBeenCalledWith('codeVerifier', result, { configId: 'configId1' });
    });
  });

  describe('isSilentRenewRunning', () => {
    it('silent renew process timeout exceeded reset state object and returns false result', () => {
      const config = {
        silentRenewTimeoutInSeconds: 10,
        configId: 'configId1',
      };

      jasmine.clock().uninstall();
      jasmine.clock().install();
      const baseTime = new Date();
      jasmine.clock().mockDate(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };

      spyOn(storagePersistenceService, 'read').withArgs('storageSilentRenewRunning', config).and.returnValue(JSON.stringify(storageObject));
      const spyWrite = spyOn(storagePersistenceService, 'write');

      jasmine.clock().tick((config.silentRenewTimeoutInSeconds + 1) * 1000);

      const isSilentRenewRunningResult = service.isSilentRenewRunning(config);

      expect(spyWrite).toHaveBeenCalledWith('storageSilentRenewRunning', '', config);
      expect(isSilentRenewRunningResult).toBeFalse();
    });

    it('checks silent renew process and returns result', () => {
      const config = {
        silentRenewTimeoutInSeconds: 10,
        configId: 'configId1',
      };

      jasmine.clock().uninstall();
      jasmine.clock().install();
      const baseTime = new Date();
      jasmine.clock().mockDate(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };

      spyOn(storagePersistenceService, 'read').withArgs('storageSilentRenewRunning', config).and.returnValue(JSON.stringify(storageObject));
      const spyWrite = spyOn(storagePersistenceService, 'write');

      const isSilentRenewRunningResult = service.isSilentRenewRunning(config);

      expect(spyWrite).not.toHaveBeenCalled();
      expect(isSilentRenewRunningResult).toBeTrue();
    });

    it('state object does not exist returns false result', () => {
      spyOn(storagePersistenceService, 'read').withArgs('storageSilentRenewRunning', { configId: 'configId1' }).and.returnValue(null);

      const isSilentRenewRunningResult = service.isSilentRenewRunning({ configId: 'configId1' });
      expect(isSilentRenewRunningResult).toBeFalse();
    });
  });

  describe('setSilentRenewRunning', () => {
    it('set setSilentRenewRunning to `running` with lauched time when called', () => {
      jasmine.clock().uninstall();
      jasmine.clock().install();
      const baseTime = new Date();
      jasmine.clock().mockDate(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };

      const spy = spyOn(storagePersistenceService, 'write');
      service.setSilentRenewRunning({ configId: 'configId1' });
      expect(spy).toHaveBeenCalledWith('storageSilentRenewRunning', JSON.stringify(storageObject), { configId: 'configId1' });
    });
  });

  describe('resetSilentRenewRunning', () => {
    it('set resetSilentRenewRunning to empty string when called', () => {
      const spy = spyOn(storagePersistenceService, 'write');
      service.resetSilentRenewRunning({ configId: 'configId1' });
      expect(spy).toHaveBeenCalledWith('storageSilentRenewRunning', '', { configId: 'configId1' });
    });
  });
});
