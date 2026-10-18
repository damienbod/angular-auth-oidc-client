import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { mockClass, mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/services/logger.service';
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

  // `unstubGlobals` only restores stubs *before* the next test, which would
  // leave `Storage` undefined for anything running between this file and the
  // next one. Spec files share globals (the builder runs Vitest with
  // `isolate: false`), so restore it here instead of leaking it.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('read', () => {
    it('should return null if configId is missing', () => {
      const config = { configId: '' };

      expect(service.read('anything', config)).toBeNull();
    });

    it('should return null if there is no storage', () => {
      const config = { configId: 'configId1' };

      vi.stubGlobal('Storage', undefined);

      expect(service.read('anything', config)).toBeNull();
    });

    it('should return null if getItem returns null', () => {
      const config = { configId: 'configId1' };
      const result = service.read('anything', config);

      expect(result).toBeNull();
    });

    it('should return the item if getItem returns an item', () => {
      const config = { configId: 'configId1' };
      const returnValue = `{ "name":"John", "age":30, "city":"New York"}`;

      vi.spyOn(abstractSecurityStorage, 'read').mockReturnValue(returnValue);
      const result = service.read('anything', config);

      expect(result).toEqual(JSON.parse(returnValue));
    });
  });

  describe('write', () => {
    it('should return false if configId is missing', () => {
      const config = { configId: '' };

      expect(service.write('anyvalue', config)).toBe(false);
    });

    it('should return false if there is no storage', () => {
      const config = { configId: 'configId1' };

      vi.stubGlobal('Storage', undefined);

      expect(service.write('anyvalue', config)).toBe(false);
    });

    it('should write object correctly with configId', () => {
      const config = { configId: 'configId1' };
      const writeSpy = vi.spyOn(abstractSecurityStorage, 'write');
      const result = service.write({ anyKey: 'anyvalue' }, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(
        'configId1',
        JSON.stringify({ anyKey: 'anyvalue' })
      );
    });

    it('should write null if item is falsy', () => {
      const config = { configId: 'configId1' };
      const writeSpy = vi.spyOn(abstractSecurityStorage, 'write');
      const somethingFalsy = '';
      const result = service.write(somethingFalsy, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith('configId1', JSON.stringify(null));
    });
  });

  describe('remove', () => {
    it('should return false if there is no storage', () => {
      const config = { configId: 'configId1' };

      vi.stubGlobal('Storage', undefined);
      expect(service.remove('anything', config)).toBe(false);
    });

    it('should return false if configId is missing', () => {
      const config = { configId: '' };

      expect(service.remove('anyKey', config)).toBe(false);
    });

    it('should remove the entire config blob for the configId', () => {
      const config = { configId: 'configId1' };
      const removeSpy = vi.spyOn(abstractSecurityStorage, 'remove');
      const result = service.remove('anyKey', config);

      expect(result).toBe(true);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith('configId1');
    });
  });

  describe('clear', () => {
    it('should return false if there is no storage', () => {
      vi.stubGlobal('Storage', undefined);
      const config = { configId: 'configId1' };

      expect(service.clear(config)).toBe(false);
    });

    it('should return false if configId is missing', () => {
      const config = { configId: '' };

      expect(service.clear(config)).toBe(false);
    });

    it('should remove only the config blob for the specified configId', () => {
      const removeSpy = vi.spyOn(abstractSecurityStorage, 'remove');
      const config = { configId: 'configId1' };
      const result = service.clear(config);

      expect(result).toBe(true);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith('configId1');
    });
  });

  describe('multi-config isolation', () => {
    it('should only remove the specified config on clear, not other configs', () => {
      const config1 = { configId: 'configId1' };
      const removeSpy = vi
        .spyOn(abstractSecurityStorage, 'remove')
        .mockReturnValue(undefined);

      service.clear(config1);

      expect(removeSpy).toHaveBeenCalledTimes(1);

      expect(removeSpy).toHaveBeenCalledWith('configId1');
      expect(removeSpy).not.toHaveBeenCalledWith('configId2');
    });

    it('should only remove the specified config blob on remove, not other configs', () => {
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
    it('should not clear the whole security storage on clear', () => {
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

    it('should not clear the whole security storage on remove', () => {
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
});
