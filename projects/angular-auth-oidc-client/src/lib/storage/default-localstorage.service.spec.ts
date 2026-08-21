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
      const spy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue(undefined as any);

      service.read('henlo');

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('henlo');
    });
  });

  describe('write', () => {
    it('should call localstorage.setItem', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockReturnValue(undefined);

      service.write('henlo', 'furiend');

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('henlo', 'furiend');
    });
  });

  describe('remove', () => {
    it('should call localstorage.removeItem', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'removeItem')
        .mockReturnValue(undefined);

      service.remove('henlo');

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('henlo');
    });
  });

  describe('clear', () => {
    it('should call localstorage.clear', () => {
      const spy = vi
        .spyOn(Storage.prototype, 'clear')
        .mockReturnValue(undefined);

      service.clear();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
