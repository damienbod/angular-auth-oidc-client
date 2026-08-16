import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { mockProvider } from '../../test/auto-mock';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { DefaultLocalStorageService } from '../storage/default-localstorage.service';
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

  afterEach(() => {
    sessionStorage.removeItem('configId1-redirect');
  });

  it('should create', () => {
    expect(autoLoginService).toBeTruthy();
  });

  describe('checkSavedRedirectRouteAndNavigate', () => {
    it('does nothing if config is null', () => {
      const readSpy = spyOn(storagePersistenceService, 'read');
      const routerSpy = spyOn(router, 'navigateByUrl');

      autoLoginService.checkSavedRedirectRouteAndNavigate(null);

      expect(readSpy).not.toHaveBeenCalled();
      expect(routerSpy).not.toHaveBeenCalled();
    });

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

    it('navigates to a route saved in this tab and clears it everywhere', () => {
      const deleteSpy = spyOn(storagePersistenceService, 'remove');
      const routerSpy = spyOn(router, 'navigateByUrl');
      const readSpy = spyOn(storagePersistenceService, 'read');

      sessionStorage.setItem('configId1-redirect', 'saved-route');

      autoLoginService.checkSavedRedirectRouteAndNavigate({
        configId: 'configId1',
      });

      expect(readSpy).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('configId1-redirect')).toBeNull();
      expect(deleteSpy).toHaveBeenCalledOnceWith('redirect', {
        configId: 'configId1',
      });
      expect(routerSpy).toHaveBeenCalledOnceWith('saved-route');
    });

    it('navigates to a route saved by a previous library version in the configured storage and clears it', () => {
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
    it('does nothing if config is null', () => {
      const writeSpy = spyOn(storagePersistenceService, 'write');

      autoLoginService.saveRedirectRoute(null, 'some-route');

      expect(writeSpy).not.toHaveBeenCalled();
      expect(sessionStorage.getItem('configId1-redirect')).toBeNull();
    });

    it('saves the route per tab and leaves the shared storage untouched', () => {
      const writeSpy = spyOn(storagePersistenceService, 'write');

      autoLoginService.saveRedirectRoute(
        { configId: 'configId1' },
        'some-route'
      );

      expect(sessionStorage.getItem('configId1-redirect')).toBe('some-route');
      expect(writeSpy).not.toHaveBeenCalled();
    });
  });
});

describe('AutoLoginService without sessionStorage', () => {
  let autoLoginService: AutoLoginService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AutoLoginService,
        mockProvider(StoragePersistenceService),
        { provide: DOCUMENT, useValue: {} },
      ],
    });
    autoLoginService = TestBed.inject(AutoLoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  it('falls back to the configured storage when sessionStorage is unavailable', () => {
    const writeSpy = spyOn(storagePersistenceService, 'write');

    autoLoginService.saveRedirectRoute({ configId: 'configId1' }, 'some-route');

    expect(writeSpy).toHaveBeenCalledOnceWith('redirect', 'some-route', {
      configId: 'configId1',
    });
  });
});

// Two tabs of the same app share one localStorage slot because configId is
// deterministic ('0-clientId' in both tabs). Real storage chain; the route
// must never land in that shared slot.
describe('AutoLoginService multi-tab redirect', () => {
  const config: OpenIdConfiguration = { configId: '0-clientId' };
  let autoLoginService: AutoLoginService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AutoLoginService,
        {
          provide: AbstractSecurityStorage,
          useClass: DefaultLocalStorageService,
        },
      ],
    });
    autoLoginService = TestBed.inject(AutoLoginService);
    router = TestBed.inject(Router);
    localStorage.removeItem('0-clientId');
    sessionStorage.removeItem('0-clientId-redirect');
  });

  afterEach(() => {
    localStorage.removeItem('0-clientId');
    sessionStorage.removeItem('0-clientId-redirect');
  });

  it('keeps the deep link out of the storage shared with other tabs', () => {
    autoLoginService.saveRedirectRoute(config, '/orders/123');

    expect(localStorage.getItem('0-clientId')).toBeNull();
    expect(sessionStorage.getItem('0-clientId-redirect')).toBe('/orders/123');
  });

  it('restores the deep link saved in this tab after the callback', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl');

    autoLoginService.saveRedirectRoute(config, '/orders/123');
    autoLoginService.checkSavedRedirectRouteAndNavigate(config);

    expect(navigateSpy).toHaveBeenCalledOnceWith('/orders/123');
    expect(sessionStorage.getItem('0-clientId-redirect')).toBeNull();
  });

  it('uses and clears a deep link a previous library version saved to the shared storage', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl');

    localStorage.setItem(
      '0-clientId',
      JSON.stringify({ redirect: '/legacy-route' })
    );

    autoLoginService.checkSavedRedirectRouteAndNavigate(config);

    expect(navigateSpy).toHaveBeenCalledOnceWith('/legacy-route');

    const sharedSlot = JSON.parse(localStorage.getItem('0-clientId') ?? '{}');

    expect(sharedSlot.redirect).toBeUndefined();
  });
});
