import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { AbstractSecurityStorage } from './abstract-security-storage';
import { BrowserStorageMock } from './browser-storage.service-mock';
import { StoragePersistenceService } from './storage-persistence.service';

describe('Storage Persistence Service', () => {
  let service: StoragePersistenceService;
  let securityStorage: AbstractSecurityStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StoragePersistenceService,
        { provide: AbstractSecurityStorage, useClass: BrowserStorageMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(StoragePersistenceService);
    securityStorage = TestBed.inject(AbstractSecurityStorage);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('read', () => {
    it('reads from oidcSecurityStorage with configId', () => {
      const spy = spyOn(securityStorage, 'read');
      service.read('authNonce', 'configId');
      expect(spy).toHaveBeenCalledWith('configId');
    });

    it('returns undefined (not throws exception) if key to read is not present on config', () => {
      spyOn(securityStorage, 'read').and.returnValue({ some: 'thing' });
      const result = service.read('authNonce', 'configId');
      expect(result).toBeUndefined();
    });
  });

  describe('write', () => {
    it('writes to oidcSecurityStorage with correct key and correct config', () => {
      const readSpy = spyOn(securityStorage, 'read');
      const writeSpy = spyOn(securityStorage, 'write');

      service.write('authNonce', 'anyValue', 'configId');

      expect(readSpy).toHaveBeenCalledWith('configId');
      expect(writeSpy).toHaveBeenCalledWith('configId', { authNonce: 'anyValue' });
    });
  });

  describe('remove', () => {
    it('should remove key from config', () => {
      const readSpy = spyOn(securityStorage, 'read').and.returnValue({ authNonce: 'anyValue' });
      const writeSpy = spyOn(securityStorage, 'write');

      service.remove('authNonce', 'configId');

      expect(readSpy).toHaveBeenCalledWith('configId');
      expect(writeSpy).toHaveBeenCalledWith('configId', {});
    });
  });

  describe('clear', () => {
    it('should call oidcSecurityStorage.clear()', () => {
      const clearSpy = spyOn(securityStorage, 'clear');

      service.clear();

      expect(clearSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetStorageFlowData', () => {
    it('resets the correct values', () => {
      const spy = spyOn(service, 'remove');

      service.resetStorageFlowData('configId');

      expect(spy).toHaveBeenCalledTimes(8);
      expect(spy.calls.argsFor(0)).toEqual(['session_state', 'configId']);
      expect(spy.calls.argsFor(1)).toEqual(['storageSilentRenewRunning', 'configId']);
      expect(spy.calls.argsFor(2)).toEqual(['codeVerifier', 'configId']);
      expect(spy.calls.argsFor(3)).toEqual(['userData', 'configId']);
      expect(spy.calls.argsFor(4)).toEqual(['storageCustomParamsAuthRequest', 'configId']);
      expect(spy.calls.argsFor(5)).toEqual(['access_token_expires_at', 'configId']);
      expect(spy.calls.argsFor(6)).toEqual(['storageCustomParamsRefresh', 'configId']);
      expect(spy.calls.argsFor(7)).toEqual(['storageCustomParamsEndSession', 'configId']);
    });
  });

  describe('resetAuthStateInStorage', () => {
    it('resets the correct values', () => {
      const spy = spyOn(service, 'remove');

      service.resetAuthStateInStorage('configId');

      expect(spy.calls.argsFor(0)).toEqual(['authzData', 'configId']);
      expect(spy.calls.argsFor(1)).toEqual(['authnResult', 'configId']);
    });
  });

  describe('getAccessToken', () => {
    it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
      const returnValue = { authzData: 'someValue' };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const result = service.getAccessToken('configId');

      expect(result).toBe('someValue');
      expect(spy).toHaveBeenCalledWith('configId');
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const spy = spyOn(securityStorage, 'read').and.returnValue(null);
      const result = service.getAccessToken('configId');

      expect(result).toBeFalsy();
      expect(spy).toHaveBeenCalledWith('configId');
    });
  });

  describe('getIdToken', () => {
    it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
      const returnValue = { authnResult: { id_token: 'someValue' } };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const result = service.getIdToken('configId');

      expect(result).toBe('someValue');
      expect(spy).toHaveBeenCalledWith('configId');
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const spy = spyOn(securityStorage, 'read').and.returnValue(null);
      const result = service.getIdToken('configId');

      expect(result).toBeFalsy();
      expect(spy).toHaveBeenCalledWith('configId');
    });
  });

  describe('getRefreshToken', () => {
    it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
      const returnValue = { authnResult: { refresh_token: 'someValue' } };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const result = service.getRefreshToken('configId');

      expect(result).toBe('someValue');
      expect(spy).toHaveBeenCalledWith('configId');
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const returnValue = { authnResult: { NO_refresh_token: 'someValue' } };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const result = service.getRefreshToken('configId');

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledWith('configId');
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const spy = spyOn(securityStorage, 'read').and.returnValue(null);
      const result = service.getRefreshToken('configId');

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledWith('configId');
    });
  });
});
