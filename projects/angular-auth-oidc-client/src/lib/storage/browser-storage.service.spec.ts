import { TestBed } from '@angular/core/testing';
import { mockClass, mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { AbstractSecurityStorage } from './abstract-security-storage';
import { BrowserStorageService } from './browser-storage.service';
import { DefaultSessionStorageService } from './default-sessionstorage.service';

describe('BrowserStorageService', () => {
  let service: BrowserStorageService;
  let abstractSecurityStorage: AbstractSecurityStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(LoggerService),
        {
          provide: AbstractSecurityStorage,
          useClass: mockClass(DefaultSessionStorageService),
        },
      ],
    });
  });

  beforeEach(() => {
    abstractSecurityStorage = TestBed.inject(AbstractSecurityStorage);
    service = TestBed.inject(BrowserStorageService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('read', () => {
    it('returns null if there is no storage', () => {
      const config = { configId: 'configId1' };

      spyOn(service as any, 'hasStorage').and.returnValue(false);

      expect(service.read('anything', config)).toBeNull();
    });

    it('returns null if getItem returns null', () => {
      const config = { configId: 'configId1' };

      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const result = service.read('anything', config);

      expect(result).toBeNull();
    });

    it('returns the item if getItem returns an item', () => {
      const config = { configId: 'configId1' };

      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const returnValue = `{ "name":"John", "age":30, "city":"New York"}`;

      spyOn(abstractSecurityStorage, 'read').and.returnValue(returnValue);
      const result = service.read('anything', config);

      expect(result).toEqual(JSON.parse(returnValue));
    });
  });

  describe('write', () => {
    it('returns false if there is no storage', () => {
      const config = { configId: 'configId1' };

      spyOn(service as any, 'hasStorage').and.returnValue(false);

      expect(service.write('anyvalue', config)).toBeFalse();
    });

    it('writes object correctly with configId', () => {
      const config = { configId: 'configId1' };

      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const writeSpy = spyOn(
        abstractSecurityStorage,
        'write'
      ).and.callThrough();      const result = service.write({ anyKey: 'anyvalue' }, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledOnceWith(
        'configId1',
        JSON.stringify({ anyKey: 'anyvalue' })
      );
    });

    it('writes null if item is falsy', () => {
      const config = { configId: 'configId1' };

      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const writeSpy = spyOn(
        abstractSecurityStorage,
        'write'
      ).and.callThrough();
      const somethingFalsy = '';      const result = service.write(somethingFalsy, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledOnceWith(
        'configId1',
        JSON.stringify(null)
      );
    });
  });

  describe('remove', () => {
    it('returns false if there is no storage', () => {
      const config = { configId: 'configId1' };

      spyOn(service as any, 'hasStorage').and.returnValue(false);
      expect(service.remove('anything', config)).toBeFalse();
    });

    it('returns false if configId is missing', () => {
      const config = { configId: '' };

      spyOn(service as any, 'hasStorage').and.returnValue(true);
      expect(service.remove('anyKey', config)).toBeFalse();
    });

    it('removes the entire config blob for the configId', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const config = { configId: 'configId1' };      const removeSpy = spyOn(
        abstractSecurityStorage,
        'remove'
      ).and.callThrough();      const result = service.remove('anyKey', config);

      expect(result).toBe(true);
      expect(removeSpy).toHaveBeenCalledOnceWith('configId1');
    });
  });

  describe('clear', () => {
    it('returns false if there is no storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      const config = { configId: 'configId1' };

      expect(service.clear(config)).toBeFalse();
    });

    it('returns false if configId is missing', () => {
      const config = { configId: '' };

      spyOn(service as any, 'hasStorage').and.returnValue(true);
      expect(service.clear(config)).toBeFalse();
    });

    it('removes only the config blob for the specified configId', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const removeSpy = spyOn(
        abstractSecurityStorage,
        'remove'
      ).and.callThrough();
      const config = { configId: 'configId1' };      const result = service.clear(config);

      expect(result).toBe(true);
      expect(removeSpy).toHaveBeenCalledOnceWith('configId1');
    });
  });

  describe('multi-config isolation', () => {
    it('clear() should only remove the specified config, not other configs', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const config1 = { configId: 'configId1' };      const removeSpy = spyOn(abstractSecurityStorage, 'remove');

      service.clear(config1);

      expect(removeSpy).toHaveBeenCalledOnceWith('configId1');
      expect(removeSpy).not.toHaveBeenCalledWith('configId2');
    });

    it('remove() should only remove the specified config blob, not other configs', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const config1 = { configId: 'configId1' };      const removeSpy = spyOn(abstractSecurityStorage, 'remove');

      service.remove('anyKey', config1);

      expect(removeSpy).toHaveBeenCalledOnceWith('configId1');
      expect(removeSpy).not.toHaveBeenCalledWith('configId2');
    });
  });

  describe('storage scope safety', () => {
    it('clear() should not call abstractSecurityStorage.clear() which would destroy all storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const config = { configId: 'configId1' };      const clearSpy = spyOn(abstractSecurityStorage, 'clear');
      const removeSpy = spyOn(abstractSecurityStorage, 'remove');

      service.clear(config);

      // Should use remove(configId), NOT clear()
      // This ensures other configs and consumer app data remain intact
      expect(clearSpy).not.toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledOnceWith('configId1');
    });

    it('remove() should not call abstractSecurityStorage.clear() which would destroy all storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const config = { configId: 'configId1' };      const clearSpy = spyOn(abstractSecurityStorage, 'clear');
      const removeSpy = spyOn(abstractSecurityStorage, 'remove');

      service.remove('anyKey', config);

      // Should use remove(configId), NOT clear()
      // This ensures other configs and consumer app data remain intact
      expect(clearSpy).not.toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledOnceWith('configId1');
    });
  });

  describe('hasStorage', () => {
    it('returns false if there is no storage', () => {
      (Storage as any) = undefined;
      expect((service as any).hasStorage()).toBeFalse();
      Storage = Storage;
    });
  });
});
