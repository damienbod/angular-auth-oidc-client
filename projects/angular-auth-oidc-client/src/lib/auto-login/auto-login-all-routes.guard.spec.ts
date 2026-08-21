import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, firstValueFrom, of } from 'rxjs';
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

      vi.spyOn(configurationService, 'getOpenIDConfiguration').mockReturnValue(
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
      it('should save current route and call `login` if not authenticated already', async () => {
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: false } as LoginResponse)
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
        const canActivate$ = guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        await firstValueFrom(canActivate$);

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url1'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({ configId: 'configId1' });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: true } as LoginResponse)
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
        const canActivate$ = guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        await firstValueFrom(canActivate$);

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: true } as LoginResponse)
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
        const canActivate$ = guard.canActivate(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        await firstValueFrom(canActivate$);

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
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: false } as LoginResponse)
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
        const canActivateChild$ = guard.canActivateChild(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        await firstValueFrom(canActivateChild$);

        expect(saveRedirectRouteSpy).toHaveBeenCalledTimes(1);
        expect(saveRedirectRouteSpy).toHaveBeenCalledWith(
          { configId: 'configId1' },
          'some-url1'
        );
        expect(loginSpy).toHaveBeenCalledTimes(1);
        expect(loginSpy).toHaveBeenCalledWith({ configId: 'configId1' });
        expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: true } as LoginResponse)
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
        const canActivateChild$ = guard.canActivateChild(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        await firstValueFrom(canActivateChild$);

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: true } as LoginResponse)
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
        const canActivateChild$ = guard.canActivateChild(
          {} as ActivatedRouteSnapshot,
          {
            url: 'some-url1',
          } as RouterStateSnapshot
        ) as Observable<boolean>;

        await firstValueFrom(canActivateChild$);

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
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: false } as LoginResponse)
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
        const canLoad$ = guard.canLoad();

        await firstValueFrom(canLoad$);

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
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: false } as LoginResponse)
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

        const canLoad$ = guard.canLoad();

        await firstValueFrom(canLoad$);

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
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: true } as LoginResponse)
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
        const canLoad$ = guard.canLoad() as Observable<boolean>;

        await firstValueFrom(canLoad$);

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });

      it('should call `checkSavedRedirectRouteAndNavigate` if authenticated already', async () => {
        vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
          of({ isAuthenticated: true } as LoginResponse)
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
        const canLoad$ = guard.canLoad() as Observable<boolean>;

        await firstValueFrom(canLoad$);

        expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
        expect(loginSpy).not.toHaveBeenCalled();
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledTimes(1);
        expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledWith({
          configId: 'configId1',
        });
      });
    });
  });
});
