import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { mockProvider } from '../../test/auto-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { AutoLoginService } from './auto-login.service';

describe('AutoLoginService ', () => {
  let autoLoginService: AutoLoginService;
  let storagePersistenceService: StoragePersistenceService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AutoLoginService, mockProvider(StoragePersistenceService)],
    });
  });

  beforeEach(() => {
    router = TestBed.inject(Router);
    autoLoginService = TestBed.inject(AutoLoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  it('should create', () => {
    expect(autoLoginService).toBeTruthy();
  });

  describe('checkSavedRedirectRouteAndNavigate', () => {
    it('does nothing if config is null', () => {
      const readSpy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockReturnValue(undefined);
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);

      autoLoginService.checkSavedRedirectRouteAndNavigate(null);

      expect(readSpy).not.toHaveBeenCalled();
      expect(routerSpy).not.toHaveBeenCalled();
    });

    it('if not route is saved, router and delete are not called', () => {
      const deleteSpy = vi
        .spyOn(storagePersistenceService, 'remove')
        .mockReturnValue(undefined);
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);
      const readSpy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockReturnValue(null);

      autoLoginService.checkSavedRedirectRouteAndNavigate({
        configId: 'configId1',
      });

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(routerSpy).not.toHaveBeenCalled();
      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(readSpy).toHaveBeenCalledWith('redirect', {
        configId: 'configId1',
      });
    });

    it('if route is saved, router and delete are called', () => {
      const deleteSpy = vi
        .spyOn(storagePersistenceService, 'remove')
        .mockReturnValue(undefined);
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);
      const readSpy = vi
        .spyOn(storagePersistenceService, 'read')
        .mockReturnValue('saved-route');

      autoLoginService.checkSavedRedirectRouteAndNavigate({
        configId: 'configId1',
      });

      expect(deleteSpy).toHaveBeenCalledTimes(1);

      expect(deleteSpy).toHaveBeenCalledWith('redirect', {
        configId: 'configId1',
      });
      expect(routerSpy).toHaveBeenCalledTimes(1);
      expect(routerSpy).toHaveBeenCalledWith('saved-route');
      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(readSpy).toHaveBeenCalledWith('redirect', {
        configId: 'configId1',
      });
    });
  });

  describe('saveRedirectRoute', () => {
    it('does nothing if config is null', () => {
      const writeSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      autoLoginService.saveRedirectRoute(null, 'some-route');

      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('calls storageService with correct params', () => {
      const writeSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      autoLoginService.saveRedirectRoute(
        { configId: 'configId1' },
        'some-route'
      );

      expect(writeSpy).toHaveBeenCalledTimes(1);

      expect(writeSpy).toHaveBeenCalledWith('redirect', 'some-route', {
        configId: 'configId1',
      });
    });
  });
});
