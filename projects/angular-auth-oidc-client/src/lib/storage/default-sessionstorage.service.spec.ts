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
      const spy = spyOn(sessionStorage, 'getItem');

      service.read('henlo');

      expect(spy).toHaveBeenCalledOnceWith('henlo');
    });
  });

  describe('write', () => {
    it('should call sessionstorage.setItem', () => {
      const spy = spyOn(sessionStorage, 'setItem');

      service.write('henlo', 'furiend');

      expect(spy).toHaveBeenCalledOnceWith('henlo', 'furiend');
    });
  });

  describe('remove', () => {
    it('should call sessionstorage.removeItem', () => {
      const spy = spyOn(sessionStorage, 'removeItem');

      service.remove('henlo');

      expect(spy).toHaveBeenCalledOnceWith('henlo');
    });
  });

  describe('clear', () => {
    it('should call sessionstorage.clear', () => {
      const spy = spyOn(sessionStorage, 'clear');

      service.clear();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
