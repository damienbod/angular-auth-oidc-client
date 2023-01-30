import { TestBed } from '@angular/core/testing';
import { DefaultLocalStorageService } from './default-localstorage.service';

describe('DefaultLocalStorageService', () => {
  let service: DefaultLocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DefaultLocalStorageService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(DefaultLocalStorageService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('read', () => {
    it('should call localstorage.getItem', () => {
      const spy = spyOn(localStorage, 'getItem');

      service.read('henlo');

      expect(spy).toHaveBeenCalledOnceWith('henlo');
    });
  });

  describe('write', () => {
    it('should call localstorage.setItem', () => {
      const spy = spyOn(localStorage, 'setItem');

      service.write('henlo', 'furiend');

      expect(spy).toHaveBeenCalledOnceWith('henlo', 'furiend');
    });
  });

  describe('remove', () => {
    it('should call localstorage.removeItem', () => {
      const spy = spyOn(localStorage, 'removeItem');

      service.remove('henlo');

      expect(spy).toHaveBeenCalledOnceWith('henlo');
    });
  });

  describe('clear', () => {
    it('should call localstorage.clear', () => {
      const spy = spyOn(localStorage, 'clear');

      service.clear();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
