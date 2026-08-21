import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DefaultSessionStorageService } from './default-sessionstorage.service';

describe('DefaultSessionStorageService', () => {
  let service: DefaultSessionStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DefaultSessionStorageService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(DefaultSessionStorageService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('read', () => {
    it('should call sessionstorage.getItem', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(undefined as any);

      service.read('henlo');

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('henlo');
    });
  });

  describe('write', () => {
    it('should call sessionstorage.setItem', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockReturnValue(undefined);

      service.write('henlo', 'furiend');

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('henlo', 'furiend');
    });
  });

  describe('remove', () => {
    it('should call sessionstorage.removeItem', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'removeItem')
        .mockReturnValue(undefined);

      service.remove('henlo');

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('henlo');
    });
  });

  describe('clear', () => {
    it('should call sessionstorage.clear', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'clear')
        .mockReturnValue(undefined);

      service.clear();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
