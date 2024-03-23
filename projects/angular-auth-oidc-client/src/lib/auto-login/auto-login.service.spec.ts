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
    it('if not route is saved, router and delete are not called', () => {
      const deleteSpy = spyOn(storagePersistenceService, 'remove');
      const routerSpy = spyOn(router, 'navigateByUrl');
      const readSpy = spyOn(storagePersistenceService, 'read').and.returnValue(
        null
      );

      autoLoginService.checkSavedRedirectRouteAndNavigate({
        configId: 'configId1',
      });

      expect(deleteSpy).not.toHaveBeenCalled();
      expect(routerSpy).not.toHaveBeenCalled();
      expect(readSpy).toHaveBeenCalledOnceWith('redirect', {
        configId: 'configId1',
      });
    });

    it('if route is saved, router and delete are called', () => {
      const deleteSpy = spyOn(storagePersistenceService, 'remove');
      const routerSpy = spyOn(router, 'navigateByUrl');
      const readSpy = spyOn(storagePersistenceService, 'read').and.returnValue(
        'saved-route'
      );

      autoLoginService.checkSavedRedirectRouteAndNavigate({
        configId: 'configId1',
      });

      expect(deleteSpy).toHaveBeenCalledOnceWith('redirect', {
        configId: 'configId1',
      });
      expect(routerSpy).toHaveBeenCalledOnceWith('saved-route');
      expect(readSpy).toHaveBeenCalledOnceWith('redirect', {
        configId: 'configId1',
      });
    });
  });

  describe('saveRedirectRoute', () => {
    it('calls storageService with correct params', () => {
      const writeSpy = spyOn(storagePersistenceService, 'write');

      autoLoginService.saveRedirectRoute(
        { configId: 'configId1' },
        'some-route'
      );

      expect(writeSpy).toHaveBeenCalledOnceWith('redirect', 'some-route', {
        configId: 'configId1',
      });
    });
  });
});
