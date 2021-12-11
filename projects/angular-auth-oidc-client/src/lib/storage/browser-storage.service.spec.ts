import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { BrowserStorageService } from './browser-storage.service';

describe('Browser Service', () => {
  let service: BrowserStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BrowserStorageService, { provide: LoggerService, useClass: LoggerServiceMock }],
    });
  });

  beforeEach(() => {
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

    it('returns null if getStorage returns null', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);
      expect(service.read('anything', config)).toBeNull();
    });

    it('returns null if getItem returns null', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const returnValue = null;

      spyOn(service as any, 'getStorage').and.returnValue({
        read: () => {
          return returnValue;
        },
      });

      const result = service.read('anything', config);

      expect(result).toBeNull();
    });

    it('returns the item if getItem returns an item', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const returnValue = `{ "name":"John", "age":30, "city":"New York"}`;

      spyOn(service as any, 'getStorage').and.returnValue({
        read: () => {
          return returnValue;
        },
      });

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

    it('returns false if getStorage returns null', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);

      expect(service.write('anyvalue', config)).toBeFalse();
    });

    it('writes object correctly with configId', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const serviceObject = {
        write: (a, b) => {},
      };
      const writeSpy = spyOn(serviceObject, 'write').and.callThrough();
      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);

      const result = service.write({ anyKey: 'anyvalue' }, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledWith('configId1', JSON.stringify({ anyKey: 'anyvalue' }));
    });

    it('writes null if item is falsy', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const serviceObject = {
        write: (a, b) => {},
      };
      const writeSpy = spyOn(serviceObject, 'write').and.callThrough();
      const somethingFalsy = '';
      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);

      const result = service.write(somethingFalsy, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledWith('configId1', JSON.stringify(null));
    });
  });

  describe('remove', () => {
    it('returns false if there is no storage', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      expect(service.remove('anything', config)).toBeFalse();
    });

    it('returns false if getStorage returns null', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);
      expect(service.remove('anything', config)).toBeFalse();
    });

    it('returns true if removeItem is called', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const config = { configId: 'configId1' };
      const serviceObject = {
        remove: (a) => {},
      };
      const setItemSpy = spyOn(serviceObject, 'remove').and.callThrough();
      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);

      const result = service.remove('anyKey', config);

      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith('anyKey');
    });
  });

  describe('clear', () => {
    it('returns false if there is no storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      const config = { configId: 'configId1' };
      expect(service.clear(config)).toBeFalse();
    });

    it('returns false if getStorage returns null', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);
      const config = { configId: 'configId1' };

      expect(service.clear(config)).toBeFalse();
    });

    it('returns true if clear is called', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const serviceObject = {
        clear: () => {},
      };

      const setItemSpy = spyOn(serviceObject, 'clear').and.callThrough();
      const config = { configId: 'configId1' };

      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);

      const result = service.clear(config);

      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStorage', () => {
    it('returns null if there is no storage', () => {
      const config = { configId: 'configId1', storage: null };
      expect((service as any).getStorage(config)).toBeNull();
    });

    it('returns null if there is no openIDConfiguration', () => {
      expect((service as any).getStorage(null)).toBeFalsy();
    });
  });

  describe('hasStorage', () => {
    it('returns false if there is no storage', () => {
      Storage = undefined;
      expect((service as any).hasStorage()).toBeFalse();
      Storage = Storage;
    });
  });
});
