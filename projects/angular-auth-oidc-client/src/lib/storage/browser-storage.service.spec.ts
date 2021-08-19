import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { BrowserStorageService } from './browser-storage.service';

describe('Browser Service', () => {
  let service: BrowserStorageService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BrowserStorageService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
      ],
    });
  });

  beforeEach(() => {
    configurationProvider = TestBed.inject(ConfigurationProvider);
    service = TestBed.inject(BrowserStorageService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('read', () => {
    it('returns null if there is no storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      expect(service.read('anything', 'configId')).toBeFalse();
    });

    it('returns false if getStorage returns null', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);
      expect(service.read('anything', 'configId')).toBeFalsy();
    });

    it('returns null if getItem returns null', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const returnValue = null;

      spyOn(service as any, 'getStorage').and.returnValue({
        read: () => {
          return returnValue;
        },
      });
      expect(service.read('anything', 'configId')).toBeFalsy();
    });

    it('returns the item if getItem returns an item', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const returnValue = `{ "name":"John", "age":30, "city":"New York"}`;

      spyOn(service as any, 'getStorage').and.returnValue({
        read: () => {
          return returnValue;
        },
      });
      expect(service.read('anything', 'configId')).toEqual(JSON.parse(returnValue));
    });
  });

  describe('write', () => {
    it('returns null if there is no storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      expect(service.write('configId', 'anyvalue')).toBeFalse();
    });

    it('returns false if getStorage returns null', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);
      expect(service.write('configId', 'anyvalue')).toBeFalse();
    });

    it('writes object correctly with configId', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const serviceObject = {
        write: (a, b) => {},
      };

      const writeSpy = spyOn(serviceObject, 'write').and.callThrough();

      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);
      const result = service.write({ anyKey: 'anyvalue' }, 'configId');
      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledWith('configId', JSON.stringify({ anyKey: 'anyvalue' }));
    });

    it('writes null if item is falsy', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const serviceObject = {
        write: (a, b) => {},
      };

      const writeSpy = spyOn(serviceObject, 'write').and.callThrough();

      const somethingFalsy = '';

      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);
      const result = service.write(somethingFalsy, 'configId');
      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledWith('configId', JSON.stringify(null));
    });
  });

  describe('remove', () => {
    it('returns false if there is no storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      expect(service.remove('anything', 'configId')).toBeFalse();
    });

    it('returns false if getStorage returns null', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);
      expect(service.remove('anything', 'configId')).toBeFalsy();
    });

    it('returns true if removeItem is called', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const serviceObject = {
        remove: (a) => {},
      };

      const setItemSpy = spyOn(serviceObject, 'remove').and.callThrough();

      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);
      const result = service.remove('anyKey', 'configId');
      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith('anyKey');
    });
  });

  describe('clear', () => {
    it('returns false if there is no storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      expect(service.clear('configId')).toBeFalse();
    });

    it('returns false if getStorage returns null', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      spyOn(service as any, 'getStorage').and.returnValue(null);

      expect(service.clear('configId')).toBeFalsy();
    });

    it('returns true if clear is called', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const serviceObject = {
        clear: () => {},
      };

      const setItemSpy = spyOn(serviceObject, 'clear').and.callThrough();

      spyOn(service as any, 'getStorage').and.returnValue(serviceObject);

      const result = service.clear('configId');

      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStorage', () => {
    it('returns null if there is no storage', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ storage: null });
      expect((service as any).getStorage()).toBeNull();
    });

    it('returns null if there is no openIDConfiguration', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue(null);
      expect((service as any).getStorage()).toBeFalsy();
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
