import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlSegment } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { CheckAuthService } from '../check-auth.service';
import { CheckAuthServiceMock } from '../check-auth.service-mock';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoginService } from '../login/login.service';
import { LoginServiceMock } from '../login/login.service-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { LoginResponse } from './../login/login-response';
import { AutoLoginAllRoutesGuard } from './auto-login-all-routes.guard';
import { AutoLoginService } from './auto-login.service';

describe(`AutoLoginAllRoutesGuard`, () => {
  let autoLoginAllRoutesGuard: AutoLoginAllRoutesGuard;
  let checkAuthService: CheckAuthService;
  let loginService: LoginService;
  let authStateService: AuthStateService;
  let router: Router;
  let storagePersistenceService: StoragePersistenceService;
  let configurationProvider: ConfigurationProvider;
  let autoLoginService: AutoLoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AutoLoginService,
        {
          provide: CheckAuthService,
          useClass: CheckAuthServiceMock,
        },
        {
          provide: LoginService,
          useClass: LoginServiceMock,
        },
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
      ],
    });
  });

  beforeEach(() => {
    checkAuthService = TestBed.inject(CheckAuthService);
    router = TestBed.inject(Router);
    loginService = TestBed.inject(LoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    configurationProvider = TestBed.inject(ConfigurationProvider);

    spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });

    autoLoginAllRoutesGuard = TestBed.inject(AutoLoginAllRoutesGuard);
    autoLoginService = TestBed.inject(AutoLoginService);
  });

  afterEach(() => {
    storagePersistenceService.clear();
  });

  it('should create', () => {
    expect(autoLoginAllRoutesGuard).toBeTruthy();
  });

  describe('canActivate', () => {
    it(
      'should save current route and call `login` if not authenticated already',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: false } as LoginResponse));
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginAllRoutesGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith('configId', 'some-url1');
          expect(loginSpy).toHaveBeenCalledOnceWith('configId');
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should call `checkSavedRedirectRouteAndNavigate` if authenticated already',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: true } as LoginResponse));
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginAllRoutesGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith('configId');
        });
      })
    );
  });

  describe('canActivateChild', () => {
    it(
      'should save current route and call `login` if not authenticated already',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: false } as LoginResponse));
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginAllRoutesGuard.canActivateChild(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith('configId', 'some-url1');
          expect(loginSpy).toHaveBeenCalledOnceWith('configId');
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should call `checkSavedRedirectRouteAndNavigate` if authenticated already',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: true } as LoginResponse));
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginAllRoutesGuard.canActivateChild(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith('configId');
        });
      })
    );
  });

  describe('canLoad', () => {
    it(
      'should save current route (empty) and call `login` if not authenticated already',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: false } as LoginResponse));
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginAllRoutesGuard.canLoad(null, []).subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith('configId', '');
          expect(loginSpy).toHaveBeenCalledOnceWith('configId');
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should save current route (with Segments)  and call `login` if not authenticated already',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: false } as LoginResponse));
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginAllRoutesGuard
          .canLoad(null, [new UrlSegment('some-url12', {}), new UrlSegment('with', {}), new UrlSegment('some-param', {})])
          .subscribe(() => {
            expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith('configId', 'some-url12/with/some-param');
            expect(loginSpy).toHaveBeenCalledOnceWith('configId');
            expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
          });
      })
    );

    it(
      'should call `checkSavedRedirectRouteAndNavigate` if authenticated already',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: true } as LoginResponse));
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginAllRoutesGuard.canLoad(null, []).subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith('configId');
        });
      })
    );
  });
});
