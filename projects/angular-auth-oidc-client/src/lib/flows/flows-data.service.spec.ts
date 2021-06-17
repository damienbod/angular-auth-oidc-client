import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { FlowsDataService } from './flows-data.service';
import { RandomService } from './random/random.service';

describe('Flows Data Service', () => {
  let service: FlowsDataService;
  let storagePersistenceService: StoragePersistenceService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FlowsDataService,
        RandomService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(FlowsDataService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('nonce', () => {
    it('createNonce returns nonce and stores it', () => {
      const spy = spyOn(storagePersistenceService, 'write');

      const result = service.createNonce('configId');

      expect(result).toBeTruthy();
      expect(spy).toHaveBeenCalledWith('authNonce', result, 'configId');
    });
  });

  describe('AuthStateControl', () => {
    it('getAuthStateControl returns property from store', () => {
      const spy = spyOn(storagePersistenceService, 'read');

      service.getAuthStateControl('configId');

      expect(spy).toHaveBeenCalledWith('authStateControl', 'configId');
    });

    it('setAuthStateControl saves property in store', () => {
      const spy = spyOn(storagePersistenceService, 'write');

      service.setAuthStateControl('ToSave', 'configId');

      expect(spy).toHaveBeenCalledWith('authStateControl', 'ToSave', 'configId');
    });
  });

  describe('getExistingOrCreateAuthStateControl', () => {
    it('if nothing stored it creates a 40 char one and saves the authStateControl', () => {
      spyOn(storagePersistenceService, 'read').withArgs('authStateControl', 'configId').and.returnValue(null);
      const setSpy = spyOn(storagePersistenceService, 'write');

      const result = service.getExistingOrCreateAuthStateControl('configId');

      expect(result).toBeTruthy();
      expect(result.length).toBe(41);
      expect(setSpy).toHaveBeenCalledWith('authStateControl', result, 'configId');
    });

    it('if stored it returns the value and does NOT Store the value again', () => {
      spyOn(storagePersistenceService, 'read').withArgs('authStateControl', 'configId').and.returnValue('someAuthStateControl');
      const setSpy = spyOn(storagePersistenceService, 'write');

      const result = service.getExistingOrCreateAuthStateControl('configId');

      expect(result).toEqual('someAuthStateControl');
      expect(result.length).toBe('someAuthStateControl'.length);
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('setSessionState', () => {
    it('setSessionState saves the value in the storage', () => {
      const spy = spyOn(storagePersistenceService, 'write');

      service.setSessionState('Genesis', 'configId');

      expect(spy).toHaveBeenCalledWith('session_state', 'Genesis', 'configId');
    });
  });

  describe('resetStorageFlowData', () => {
    it('resetStorageFlowData calls correct method on storagePersistenceService', () => {
      const spy = spyOn(storagePersistenceService, 'resetStorageFlowData');

      service.resetStorageFlowData('configId');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('codeVerifier', () => {
    it('getCodeVerifier returns value from the store', () => {
      const spy = spyOn(storagePersistenceService, 'read').withArgs('codeVerifier', 'configId').and.returnValue('Genesis');

      const result = service.getCodeVerifier('configId');

      expect(result).toBe('Genesis');
      expect(spy).toHaveBeenCalledWith('codeVerifier', 'configId');
    });

    it('createCodeVerifier returns random createCodeVerifier and stores it', () => {
      const setSpy = spyOn(storagePersistenceService, 'write');

      const result = service.createCodeVerifier('configId');

      expect(result).toBeTruthy();
      expect(result.length).toBe(67);
      expect(setSpy).toHaveBeenCalledWith('codeVerifier', result, 'configId');
    });
  });

  describe('isSilentRenewRunning', () => {
    it('silent renew process timeout exceeded reset state object and returns false result', () => {
      const openIDConfiguration = {
        silentRenewTimeoutInSeconds: 10,
      };
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue(openIDConfiguration);

      jasmine.clock().uninstall();
      jasmine.clock().install();
      const baseTime = new Date();
      jasmine.clock().mockDate(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('storageSilentRenewRunning', 'configId')
        .and.returnValue(JSON.stringify(storageObject));
      const spyWrite = spyOn(storagePersistenceService, 'write');

      jasmine.clock().tick((openIDConfiguration.silentRenewTimeoutInSeconds + 1) * 1000);

      const isSilentRenewRunningResult = service.isSilentRenewRunning('configId');

      expect(spyWrite).toHaveBeenCalledWith('storageSilentRenewRunning', '', 'configId');
      expect(isSilentRenewRunningResult).toBeFalse();
    });

    it('checks silent renew process and returns result', () => {
      const openIDConfiguration = {
        silentRenewTimeoutInSeconds: 10,
      };
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue(openIDConfiguration);

      jasmine.clock().uninstall();
      jasmine.clock().install();
      const baseTime = new Date();
      jasmine.clock().mockDate(baseTime);

      const storageObject = {
        state: 'running',
        dateOfLaunchedProcessUtc: baseTime.toISOString(),
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('storageSilentRenewRunning', 'configId')
        .and.returnValue(JSON.stringify(storageObject));
      const spyWrite = spyOn(storagePersistenceService, 'write');

      const isSilentRenewRunningResult = service.isSilentRenewRunning('configId');

      expect(spyWrite).not.toHaveBeenCalled();
      expect(isSilentRenewRunningResult).toBeTrue();
    });

    it('state object does not exist returns false result', () => {
      spyOn(storagePersistenceService, 'read').withArgs('storageSilentRenewRunning', 'configId').and.returnValue(null);

      const isSilentRenewRunningResult = service.isSilentRenewRunning('configId');
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
      service.setSilentRenewRunning('configId');
      expect(spy).toHaveBeenCalledWith('storageSilentRenewRunning', JSON.stringify(storageObject), 'configId');
    });
  });

  describe('resetSilentRenewRunning', () => {
    it('set resetSilentRenewRunning to empty string when called', () => {
      const spy = spyOn(storagePersistenceService, 'write');
      service.resetSilentRenewRunning('configId');
      expect(spy).toHaveBeenCalledWith('storageSilentRenewRunning', '', 'configId');
    });
  });
});
