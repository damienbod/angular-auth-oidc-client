import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    it('returns null if configId is missing', () => {
      const config = { configId: '' };

      expect(service.read('anything', config)).toBeNull();
    });

    it('returns null if there is no storage', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(false);

      expect(service.read('anything', config)).toBeNull();
    });

    it('returns null if getItem returns null', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);

      const result = service.read('anything', config);

      expect(result).toBeNull();
    });

    it('returns the item if getItem returns an item', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      const returnValue = `{ "name":"John", "age":30, "city":"New York"}`;

      vi.spyOn(abstractSecurityStorage, 'read').mockReturnValue(returnValue);
      const result = service.read('anything', config);

      expect(result).toEqual(JSON.parse(returnValue));
    });
  });

  describe('write', () => {
    it('returns false if configId is missing', () => {
      const config = { configId: '' };

      expect(service.write('anyvalue', config)).toBe(false);
    });

    it('returns false if there is no storage', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(false);

      expect(service.write('anyvalue', config)).toBe(false);
    });

    it('writes object correctly with configId', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      const writeSpy = vi.spyOn(abstractSecurityStorage, 'write');
      const result = service.write({ anyKey: 'anyvalue' }, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(
        'configId1',
        JSON.stringify({ anyKey: 'anyvalue' })
      );
    });

    it('writes null if item is falsy', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);

      const writeSpy = vi.spyOn(abstractSecurityStorage, 'write');
      const somethingFalsy = '';
      const result = service.write(somethingFalsy, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith('configId1', JSON.stringify(null));
    });
  });

  describe('remove', () => {
    it('returns false if there is no storage', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(false);
      expect(service.remove('anything', config)).toBe(false);
    });

    it('returns false if configId is missing', () => {
      const config = { configId: '' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      expect(service.remove('anyKey', config)).toBe(false);
    });

    it('removes the entire config blob for the configId', () => {
      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      const config = { configId: 'configId1' };
      const removeSpy = vi.spyOn(abstractSecurityStorage, 'remove');
      const result = service.remove('anyKey', config);

      expect(result).toBe(true);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith('configId1');
    });
  });

  describe('clear', () => {
    it('returns false if there is no storage', () => {
      vi.spyOn(service as any, 'hasStorage').mockReturnValue(false);
      const config = { configId: 'configId1' };

      expect(service.clear(config)).toBe(false);
    });

    it('returns false if configId is missing', () => {
      const config = { configId: '' };

      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      expect(service.clear(config)).toBe(false);
    });

    it('removes only the config blob for the specified configId', () => {
      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);

      const removeSpy = vi.spyOn(abstractSecurityStorage, 'remove');
      const config = { configId: 'configId1' };
      const result = service.clear(config);

      expect(result).toBe(true);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith('configId1');
    });
  });

  describe('multi-config isolation', () => {
    it('clear() should only remove the specified config, not other configs', () => {
      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      const config1 = { configId: 'configId1' };
      const removeSpy = vi
        .spyOn(abstractSecurityStorage, 'remove')
        .mockReturnValue(undefined);

      service.clear(config1);

      expect(removeSpy).toHaveBeenCalledTimes(1);

      expect(removeSpy).toHaveBeenCalledWith('configId1');
      expect(removeSpy).not.toHaveBeenCalledWith('configId2');
    });

    it('remove() should only remove the specified config blob, not other configs', () => {
      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      const config1 = { configId: 'configId1' };
      const removeSpy = vi
        .spyOn(abstractSecurityStorage, 'remove')
        .mockReturnValue(undefined);

      service.remove('anyKey', config1);

      expect(removeSpy).toHaveBeenCalledTimes(1);

      expect(removeSpy).toHaveBeenCalledWith('configId1');
      expect(removeSpy).not.toHaveBeenCalledWith('configId2');
    });
  });

  describe('storage scope safety', () => {
    it('clear() should not call abstractSecurityStorage.clear() which would destroy all storage', () => {
      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      const config = { configId: 'configId1' };
      const clearSpy = vi
        .spyOn(abstractSecurityStorage, 'clear')
        .mockReturnValue(undefined);
      const removeSpy = vi
        .spyOn(abstractSecurityStorage, 'remove')
        .mockReturnValue(undefined);

      service.clear(config);

      // Should use remove(configId), NOT clear()
      // This ensures other configs and consumer app data remain intact
      expect(clearSpy).not.toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith('configId1');
    });

    it('remove() should not call abstractSecurityStorage.clear() which would destroy all storage', () => {
      vi.spyOn(service as any, 'hasStorage').mockReturnValue(true);
      const config = { configId: 'configId1' };
      const clearSpy = vi
        .spyOn(abstractSecurityStorage, 'clear')
        .mockReturnValue(undefined);
      const removeSpy = vi
        .spyOn(abstractSecurityStorage, 'remove')
        .mockReturnValue(undefined);

      service.remove('anyKey', config);

      // Should use remove(configId), NOT clear()
      // This ensures other configs and consumer app data remain intact
      expect(clearSpy).not.toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith('configId1');
    });
  });

  describe('hasStorage', () => {
    it('returns false if there is no storage', () => {
      (Storage as any) = undefined;
      expect((service as any).hasStorage()).toBe(false);
      Storage = Storage;
    });
  });
});
