import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { firstValueFrom, of } from 'rxjs';
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

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
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
      it('should save current route and call `login` if not authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(
          guard.canActivate(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
        );

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url1'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should save current route and call `login` if not authenticated already and add custom params', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(
          guard.canActivate(
            { data: { custom: 'param' } } as unknown as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
        );

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url1'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          { customParams: { custom: 'param' } }
        );
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          true
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(
          guard.canActivate(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
        );

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });
    });

    describe('canActivateChild', () => {
      it('should save current route and call `login` if not authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(
          guard.canActivateChild(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
        );

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url1'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should save current route and call `login` if not authenticated already with custom params', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(
          guard.canActivateChild(
            { data: { custom: 'param' } } as unknown as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
        );

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url1'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          { customParams: { custom: 'param' } }
        );
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          true
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(
          guard.canActivateChild(
            {} as ActivatedRouteSnapshot,
            { url: 'some-url1' } as RouterStateSnapshot
          )
        );

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });
    });

    describe('canLoad', () => {
      it('should save current route (empty) and call `login` if not authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(guard.canLoad());

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          ''
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({ configId: 'configId1' });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should save current route (with router extractedUrl) and call `login` if not authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        vi.spyOn(router, 'currentNavigation').mockReturnValue({
          extractedUrl: router.parseUrl(
            'some-url12/with/some-param?queryParam=true'
          ),
          extras: {},
          id: 1,
          initialUrl: router.parseUrl(''),
          previousNavigation: null,
          trigger: 'imperative',
          abort: () => void 0,
        });

        await firstValueFrom(guard.canLoad());

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url12/with/some-param?queryParam=true'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({ configId: 'configId1' });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          true
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);

        await firstValueFrom(guard.canLoad());

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });
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

        vi.spyOn(
          configurationService,
          'getOpenIDConfiguration'
        ).mockReturnValue(of({ configId: 'configId1' }));

        autoLoginService = TestBed.inject(AutoLoginService);
        router = TestBed.inject(Router);
      });

      afterEach(() => {
        storagePersistenceService.clear({});
      });

      it('should save current route (empty) and call `login` if not authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);
        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuard
        );

        await firstValueFrom(guard$);

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          ''
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({ configId: 'configId1' });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should save current route (with router extractedUrl) and call `login` if not authenticated already', async () => {
        vi.spyOn(router, 'currentNavigation').mockReturnValue({
          extractedUrl: router.parseUrl(
            'some-url12/with/some-param?queryParam=true'
          ),
          extras: {},
          id: 1,
          initialUrl: router.parseUrl(''),
          previousNavigation: null,
          trigger: 'imperative',
          abort: () => void 0,
        });

        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);
        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuard
        );

        await firstValueFrom(guard$);

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url12/with/some-param?queryParam=true'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({ configId: 'configId1' });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should save current route and call `login` if not authenticated already and add custom params', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);
        const guard$ = TestBed.runInInjectionContext(() =>
          autoLoginPartialRoutesGuard({
            data: { custom: 'param' },
          } as unknown as ActivatedRouteSnapshot)
        );

        await firstValueFrom(guard$);

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          ''
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          { customParams: { custom: 'param' } }
        );
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          true
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);
        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuard
        );

        await firstValueFrom(guard$);

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });
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

        vi.spyOn(
          configurationService,
          'getOpenIDConfiguration'
        ).mockImplementation((configId) => of({ configId }));

        autoLoginService = TestBed.inject(AutoLoginService);
      });

      afterEach(() => {
        storagePersistenceService.clear({});
      });

      it('should save current route (empty) and call `login` if not authenticated already', async () => {
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const checkSavedRedirectRouteAndNavigateSpy = vi
          .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
          .mockReturnValue(undefined);
        const saveRedirectRouteSpy = vi
          .spyOn(autoLoginService, 'saveRedirectRoute')
          .mockReturnValue(undefined);
        const loginSpy = vi
          .spyOn(loginService, 'login')
          .mockReturnValue(undefined);
        const guard$ = TestBed.runInInjectionContext(
          autoLoginPartialRoutesGuardWithConfig('configId1')
        );

        await firstValueFrom(guard$);

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          ''
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({ configId: 'configId1' });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });
    });
  });
});
