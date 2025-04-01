import { TestBed, waitForAsync } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { CheckAuthService } from '../auth-state/check-auth.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import {
  AutoLoginPartialRoutesGuard,
  autoLoginPartialRoutesGuard,
  autoLoginPartialRoutesGuardWithConfig,
} from './auto-login-partial-routes.guard';
import { AutoLoginService } from './auto-login.service';

describe(`AutoLoginPartialRoutesGuard`, () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AutoLoginService,
        mockProvider(AuthStateService),
        mockProvider(LoginService),
        mockProvider(StoragePersistenceService),
        mockProvider(CheckAuthService),
        mockProvider(ConfigurationService),
      ],
    });
  });

  describe('Class based', () => {
    let guard: AutoLoginPartialRoutesGuard;
    let loginService: LoginService;
    let authStateService: AuthStateService;
    let storagePersistenceService: StoragePersistenceService;
    let configurationService: ConfigurationService;
    let autoLoginService: AutoLoginService;
    let router: Router;

    beforeEach(() => {
      authStateService = TestBed.inject(AuthStateService);
      loginService = TestBed.inject(LoginService);
      storagePersistenceService = TestBed.inject(StoragePersistenceService);
      configurationService = TestBed.inject(ConfigurationService);

      spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(
        of({ configId: 'configId1' })
      );

      guard = TestBed.inject(AutoLoginPartialRoutesGuard);
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
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
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

        guard
          .canActivate(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
          .subscribe(() => {
            expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
              { configId: 'configId1' },
              'some-url1'
            );
            expect(loginSpy).toHaveBeenCalledOnceWith({
              configId: 'configId1',
            });
            expect(
              checkSavedRedirectRouteAndNavigateSpy
            ).not.toHaveBeenCalled();
          });
      }));

      it('should save current route and call `login` if not authenticated already and add custom params', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
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

        guard
          .canActivate(
            { data: { custom: 'param' } } as unknown as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
          .subscribe(() => {
            expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
              { configId: 'configId1' },
              'some-url1'
            );
            expect(loginSpy).toHaveBeenCalledOnceWith(
              { configId: 'configId1' },
              { customParams: { custom: 'param' } }
            );
            expect(
              checkSavedRedirectRouteAndNavigateSpy
            ).not.toHaveBeenCalled();
          });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          true
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

        guard
          .canActivate(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
          .subscribe(() => {
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
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
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

        guard
          .canActivateChild(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
          .subscribe(() => {
            expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
              { configId: 'configId1' },
              'some-url1'
            );
            expect(loginSpy).toHaveBeenCalledOnceWith({
              configId: 'configId1',
            });
            expect(
              checkSavedRedirectRouteAndNavigateSpy
            ).not.toHaveBeenCalled();
          });
      }));

      it('should save current route and call `login` if not authenticated already with custom params', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
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

        guard
          .canActivateChild(
            { data: { custom: 'param' } } as unknown as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
          .subscribe(() => {
            expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
              { configId: 'configId1' },
              'some-url1'
            );
            expect(loginSpy).toHaveBeenCalledOnceWith(
              { configId: 'configId1' },
              { customParams: { custom: 'param' } }
            );
            expect(
              checkSavedRedirectRouteAndNavigateSpy
            ).not.toHaveBeenCalled();
          });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          true
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

        guard
          .canActivateChild(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
          .subscribe(() => {
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
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
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

        guard.canLoad().subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            ''
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should save current route (with router extractedUrl) and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
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

        spyOn(router, 'getCurrentNavigation').and.returnValue({
          extractedUrl: router.parseUrl(
            'some-url12/with/some-param?queryParam=true'
          ),
          extras: {},
          id: 1,
          initialUrl: router.parseUrl(''),
          previousNavigation: null,
          trigger: 'imperative',
        });

        guard.canLoad().subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            'some-url12/with/some-param?queryParam=true'
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          true
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

        guard.canLoad().subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      }));
    });
  });

  describe('functional', () => {
    describe('autoLoginPartialRoutesGuard', () => {
      let loginService: LoginService;
      let authStateService: AuthStateService;
      let storagePersistenceService: StoragePersistenceService;
      let configurationService: ConfigurationService;
      let autoLoginService: AutoLoginService;
      let router: Router;

      beforeEach(() => {
        authStateService = TestBed.inject(AuthStateService);
        loginService = TestBed.inject(LoginService);
        storagePersistenceService = TestBed.inject(StoragePersistenceService);
        configurationService = TestBed.inject(ConfigurationService);

        spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(
          of({ configId: 'configId1' })
        );

        autoLoginService = TestBed.inject(AutoLoginService);
        router = TestBed.inject(Router);
      });

      afterEach(() => {
        storagePersistenceService.clear({});
      });

      it('should save current route (empty) and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuard
        );

        guard$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            ''
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should save current route (with router extractedUrl) and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(router, 'getCurrentNavigation').and.returnValue({
          extractedUrl: router.parseUrl(
            'some-url12/with/some-param?queryParam=true'
          ),
          extras: {},
          id: 1,
          initialUrl: router.parseUrl(''),
          previousNavigation: null,
          trigger: 'imperative',
        });

        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuard
        );

        guard$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            'some-url12/with/some-param?queryParam=true'
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should save current route and call `login` if not authenticated already and add custom params', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');        const guard$ = TestBed.runInInjectionContext(() =>
          autoLoginPartialRoutesGuard({
            data: { custom: 'param' },
          } as unknown as ActivatedRouteSnapshot)
        );

        guard$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            ''
          );
          expect(loginSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            { customParams: { custom: 'param' } }
          );
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          true
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuard
        );

        guard$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(
            checkSavedRedirectRouteAndNavigateSpy
          ).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      }));
    });

    describe('autoLoginPartialRoutesGuardWithConfig', () => {
      let loginService: LoginService;
      let authStateService: AuthStateService;
      let storagePersistenceService: StoragePersistenceService;
      let configurationService: ConfigurationService;
      let autoLoginService: AutoLoginService;

      beforeEach(() => {
        authStateService = TestBed.inject(AuthStateService);
        loginService = TestBed.inject(LoginService);
        storagePersistenceService = TestBed.inject(StoragePersistenceService);
        configurationService = TestBed.inject(ConfigurationService);

        spyOn(configurationService, 'getOpenIDConfiguration').and.callFake(
          (configId) => of({ configId })
        );

        autoLoginService = TestBed.inject(AutoLoginService);
      });

      afterEach(() => {
        storagePersistenceService.clear({});
      });

      it('should save current route (empty) and call `login` if not authenticated already', waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(
          autoLoginService,
          'checkSavedRedirectRouteAndNavigate'
        );
        const saveRedirectRouteSpy = spyOn(
          autoLoginService,
          'saveRedirectRoute'
        );
        const loginSpy = spyOn(loginService, 'login');        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuardWithConfig('configId1')
        );

        guard$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith(
            { configId: 'configId1' },
            ''
          );
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      }));
    });
  });
});
