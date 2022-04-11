import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { AbstractSecurityStorage } from './abstract-security-storage';
import { BrowserStorageService } from './browser-storage.service';
import { DefaultSessionStorageService } from './default-sessionstorage.service';

describe('Browser Service', () => {
  let service: BrowserStorageService;
  let abstractSecurityStorage: AbstractSecurityStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AbstractSecurityStorage, useClass: mockClass(DefaultSessionStorageService) },
        BrowserStorageService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
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
      const writeSpy = spyOn(abstractSecurityStorage, 'write').and.callThrough();

      const result = service.write({ anyKey: 'anyvalue' }, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledOnceWith('configId1', JSON.stringify({ anyKey: 'anyvalue' }));
    });

    it('writes null if item is falsy', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const writeSpy = spyOn(abstractSecurityStorage, 'write').and.callThrough();
      const somethingFalsy = '';

      const result = service.write(somethingFalsy, config);

      expect(result).toBe(true);
      expect(writeSpy).toHaveBeenCalledOnceWith('configId1', JSON.stringify(null));
    });
  });

  describe('remove', () => {
    it('returns false if there is no storage', () => {
      const config = { configId: 'configId1' };
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      expect(service.remove('anything', config)).toBeFalse();
    });

    it('returns true if removeItem is called', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);
      const config = { configId: 'configId1' };

      const setItemSpy = spyOn(abstractSecurityStorage, 'remove').and.callThrough();

      const result = service.remove('anyKey', config);

      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledOnceWith('anyKey');
    });
  });

  describe('clear', () => {
    it('returns false if there is no storage', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(false);
      const config = { configId: 'configId1' };
      expect(service.clear(config)).toBeFalse();
    });

    it('returns true if clear is called', () => {
      spyOn(service as any, 'hasStorage').and.returnValue(true);

      const setItemSpy = spyOn(abstractSecurityStorage, 'clear').and.callThrough();
      const config = { configId: 'configId1' };

      const result = service.clear(config);

      expect(result).toBe(true);
      expect(setItemSpy).toHaveBeenCalledTimes(1);
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
