import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../test/auto-mock';
import { BrowserStorageService } from './browser-storage.service';
import { StoragePersistenceService } from './storage-persistence.service';

describe('Storage Persistence Service', () => {
  let service: StoragePersistenceService;
  let securityStorage: BrowserStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StoragePersistenceService, { provide: BrowserStorageService, useClass: mockClass(BrowserStorageService) }],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(StoragePersistenceService);
    securityStorage = TestBed.inject(BrowserStorageService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('read', () => {
    it('reads from oidcSecurityStorage with configId', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn(securityStorage, 'read');

      service.read('authNonce', config);
      expect(spy).toHaveBeenCalledOnceWith('authNonce', config);
    });

    it('returns undefined (not throws exception) if key to read is not present on config', () => {
      const config = { configId: 'configId1' };

      spyOn(securityStorage, 'read').and.returnValue({ some: 'thing' });
      const result = service.read('authNonce', config);

      expect(result).toBeUndefined();
    });
  });

  describe('write', () => {
    it('writes to oidcSecurityStorage with correct key and correct config', () => {
      const config = { configId: 'configId1' };
      const readSpy = spyOn(securityStorage, 'read');
      const writeSpy = spyOn(securityStorage, 'write');

      service.write('authNonce', 'anyValue', config);

      expect(readSpy).toHaveBeenCalledOnceWith('authNonce', config);
      expect(writeSpy).toHaveBeenCalledOnceWith({ authNonce: 'anyValue' }, config);
    });
  });

  describe('remove', () => {
    it('should remove key from config', () => {
      const config = { configId: 'configId1' };
      const readSpy = spyOn(securityStorage, 'read').and.returnValue({ authNonce: 'anyValue' });
      const writeSpy = spyOn(securityStorage, 'write');

      service.remove('authNonce', config);

      expect(readSpy).toHaveBeenCalledOnceWith('authNonce', config);
      expect(writeSpy).toHaveBeenCalledOnceWith({}, config);
    });

    it('does not crash when read with configId returns null', () => {
      const config = { configId: 'configId1' };
      const readSpy = spyOn(securityStorage, 'read').and.returnValue(null);
      const writeSpy = spyOn(securityStorage, 'write');

      service.remove('authNonce', config);

      expect(readSpy).toHaveBeenCalledOnceWith('authNonce', config);
      expect(writeSpy).toHaveBeenCalledOnceWith({}, config);
    });
  });

  describe('clear', () => {
    it('should call oidcSecurityStorage.clear()', () => {
      const clearSpy = spyOn(securityStorage, 'clear');

      service.clear(null);

      expect(clearSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetStorageFlowData', () => {
    it('resets the correct values', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn(service, 'remove');

      service.resetStorageFlowData(config);

      expect(spy).toHaveBeenCalledTimes(10);
      expect(spy.calls.argsFor(0)).toEqual(['session_state', config]);
      expect(spy.calls.argsFor(1)).toEqual(['storageSilentRenewRunning', config]);
      expect(spy.calls.argsFor(2)).toEqual(['storageCodeFlowInProgress', config]);
      expect(spy.calls.argsFor(3)).toEqual(['codeVerifier', config]);
      expect(spy.calls.argsFor(4)).toEqual(['userData', config]);
      expect(spy.calls.argsFor(5)).toEqual(['storageCustomParamsAuthRequest', config]);
      expect(spy.calls.argsFor(6)).toEqual(['access_token_expires_at', config]);
      expect(spy.calls.argsFor(7)).toEqual(['storageCustomParamsRefresh', config]);
      expect(spy.calls.argsFor(8)).toEqual(['storageCustomParamsEndSession', config]);
      expect(spy.calls.argsFor(9)).toEqual(['reusable_refresh_token', config]);
    });
  });

  describe('resetAuthStateInStorage', () => {
    it('resets the correct values', () => {
      const config = { configId: 'configId1' };
      const spy = spyOn(service, 'remove');

      service.resetAuthStateInStorage(config);

      expect(spy.calls.argsFor(0)).toEqual(['authzData', config]);
      expect(spy.calls.argsFor(1)).toEqual(['reusable_refresh_token', config]);
      expect(spy.calls.argsFor(2)).toEqual(['authnResult', config]);
    });
  });

  describe('getAccessToken', () => {
    it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
      const returnValue = { authzData: 'someValue' };
      const config = { configId: 'configId1' };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const result = service.getAccessToken(config);

      expect(result).toBe('someValue');
      expect(spy).toHaveBeenCalledOnceWith('authzData', config);
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const spy = spyOn(securityStorage, 'read').and.returnValue(null);
      const config = { configId: 'configId1' };
      const result = service.getAccessToken(config);

      expect(result).toBeFalsy();
      expect(spy).toHaveBeenCalledOnceWith('authzData', config);
    });
  });

  describe('getIdToken', () => {
    it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
      const returnValue = { authnResult: { id_token: 'someValue' } };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const config = { configId: 'configId1' };
      const result = service.getIdToken(config);

      expect(result).toBe('someValue');
      expect(spy).toHaveBeenCalledOnceWith('authnResult', config);
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const spy = spyOn(securityStorage, 'read').and.returnValue(null);
      const config = { configId: 'configId1' };
      const result = service.getIdToken(config);

      expect(result).toBeFalsy();
      expect(spy).toHaveBeenCalledOnceWith('authnResult', config);
    });
  });

  describe('getAuthenticationResult', () => {
    it('get calls oidcSecurityStorage.read with correct key and returns the value', () => {
      const returnValue = { authnResult: { id_token: 'someValue' } };
      const config = { configId: 'configId1' };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const result = service.getAuthenticationResult(config);

      expect(result.id_token).toBe('someValue');
      expect(spy).toHaveBeenCalledOnceWith('authnResult', config);
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const spy = spyOn(securityStorage, 'read').and.returnValue(null);
      const config = { configId: 'configId1' };
      const result = service.getAuthenticationResult(config);

      expect(result).toBeFalsy();
      expect(spy).toHaveBeenCalledOnceWith('authnResult', config);
    });
  });

  describe('getRefreshToken', () => {
    it('get calls oidcSecurityStorage.read with correct key and returns the value (refresh token with mandatory rotation - default)', () => {
      const returnValue = { authnResult: { refresh_token: 'someValue' } };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const config = { configId: 'configId1' };
      const result = service.getRefreshToken(config);

      expect(result).toBe('someValue');
      expect(spy).toHaveBeenCalledOnceWith('authnResult', config);
    });

    it('get calls oidcSecurityStorage.read with correct key and returns the value (refresh token without rotation)', () => {
      const returnValue = { reusable_refresh_token: 'test_refresh_token' };
      const config = { configId: 'configId1', allowUnsafeReuseRefreshToken: true };
      let spy = spyOn(securityStorage, 'read');

      spy.withArgs('reusable_refresh_token', config).and.returnValue(returnValue);
      spy.withArgs('authnResult', config).and.returnValue(undefined);
      const result = service.getRefreshToken(config);

      expect(result).toBe(returnValue.reusable_refresh_token);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith('authnResult', config);
      expect(spy).toHaveBeenCalledWith('reusable_refresh_token', config);
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const returnValue = { authnResult: { NO_refresh_token: 'someValue' } };
      const spy = spyOn(securityStorage, 'read').and.returnValue(returnValue);
      const config = { configId: 'configId1' };
      const result = service.getRefreshToken(config);

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledOnceWith('authnResult', config);
    });

    it('get calls oidcSecurityStorage.read with correct key and returns null', () => {
      const spy = spyOn(securityStorage, 'read').and.returnValue(null);
      const config = { configId: 'configId1' };
      const result = service.getRefreshToken(config);

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledOnceWith('authnResult', config);
    });
  });
});
