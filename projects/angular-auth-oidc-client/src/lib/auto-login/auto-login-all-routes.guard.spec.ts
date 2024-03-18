import { TestBed, waitForAsync } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { CheckAuthService } from '../auth-state/check-auth.service';
import { ConfigurationService } from '../config/config.service';
import { LoginResponse } from '../login/login-response';
import { LoginService } from '../login/login.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { AutoLoginAllRoutesGuard } from './auto-login-all-routes.guard';
import { AutoLoginService } from './auto-login.service';

describe(`AutoLoginAllRoutesGuard`, () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AutoLoginService,
        mockProvider(CheckAuthService),
        mockProvider(LoginService),
        mockProvider(StoragePersistenceService),
        mockProvider(ConfigurationService),
      ],
    });
  });

  describe('Class based', () => {
    let guard: AutoLoginAllRoutesGuard;
    let checkAuthService: CheckAuthService;
    let loginService: LoginService;
    let storagePersistenceService: StoragePersistenceService;
    let configurationService: ConfigurationService;
    let autoLoginService: AutoLoginService;
    let router: Router;

    beforeEach(() => {
      checkAuthService = TestBed.inject(CheckAuthService);
      loginService = TestBed.inject(LoginService);
      storagePersistenceService = TestBed.inject(StoragePersistenceService);
      configurationService = TestBed.inject(ConfigurationService);

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(
        of({ configId: 'configId1' })
      );

      guard = TestBed.inject(AutoLoginAllRoutesGuard);
      autoLoginService = TestBed.inject(AutoLoginService);
      router = TestBed.inject(Router);
    });

    afterEach(() => {
      storagePersistenceService.clear({});
    });

    it('should create', () => {
      expect(guard).toBeTruthy();
    });

    describe('canActivate', () => {
      it('should save current route and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: false } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');

        const canActivate$ = guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        canActivate$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            'some-url1'
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: true } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canActivate$ = guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        canActivate$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({
            configId: 'configId1',
          });
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: true } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canActivate$ = guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        canActivate$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      }));
    });

    describe('canActivateChild', () => {
      it('should save current route and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: false } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canActivateChild$ = guard.canActivateChild(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        canActivateChild$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            'some-url1'
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: true } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canActivateChild$ = guard.canActivateChild(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        canActivateChild$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({
            configId: 'configId1',
          });
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: true } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canActivateChild$ = guard.canActivateChild(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        canActivateChild$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      }));
    });

    describe('canLoad', () => {
      it('should save current route (empty) and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: false } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canLoad$ = guard.canLoad();

        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            ''
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should save current route (with router extractedUrl) and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: false } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const _routerSpy = spyOn(
          router,
          'getCurrentNavigation'
        ).and.returnValue({
          extractedUrl: router.parseUrl(
            'some-url12/with/some-param?queryParam=true'
          ),
          extras: {},
          id: 1,
          initialUrl: router.parseUrl(''),
          previousNavigation: null,
          trigger: 'imperative',
        });
        const canLoad$ = guard.canLoad();

        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            'some-url12/with/some-param?queryParam=true'
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: true } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canLoad$ = guard.canLoad() as Observable<boolean>;

        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({
            configId: 'configId1',
          });
        });
      }));

      it('should save current route (with router extractedUrl) and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: false } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const _routerSpy = spyOn(
          router,
          'getCurrentNavigation'
        ).and.returnValue({
          extractedUrl: router.parseUrl(
            'some-url12/with/some-param?queryParam=true'
          ),
          extras: {},
          id: 1,
          initialUrl: router.parseUrl(''),
          previousNavigation: null,
          trigger: 'imperative',
        });
        const canLoad$ = guard.canLoad();

        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            'some-url12/with/some-param?queryParam=true'
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: true } as LoginResponse)
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');
        const canLoad$ = guard.canLoad() as Observable<boolean>;

        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      }));
    });
  });
});
