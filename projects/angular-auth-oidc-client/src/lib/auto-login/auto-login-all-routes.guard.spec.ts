import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterStateSnapshot, UrlSegment } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { CheckAuthService } from '../auth-state/check-auth.service';
import { CheckAuthServiceMock } from '../auth-state/check-auth.service-mock';
import { ConfigurationService } from '../config/config.service';
import { ConfigurationServiceMock } from '../config/config.service.mock';
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
  let storagePersistenceService: StoragePersistenceService;
  let configurationService: ConfigurationService;
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
          provide: ConfigurationService,
          useClass: ConfigurationServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    checkAuthService = TestBed.inject(CheckAuthService);
    loginService = TestBed.inject(LoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    configurationService = TestBed.inject(ConfigurationService);

    spyOn(configurationService, 'getOpenIDConfiguration').and.returnValue(of({ configId: 'configId1' }));

    autoLoginAllRoutesGuard = TestBed.inject(AutoLoginAllRoutesGuard);
    autoLoginService = TestBed.inject(AutoLoginService);
  });

  afterEach(() => {
    storagePersistenceService.clear(null);
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

        const canActivate$ = autoLoginAllRoutesGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot) as Observable<boolean>;
        canActivate$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, 'some-url1');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
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
        const canActivate$ = autoLoginAllRoutesGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot) as Observable<boolean>;

        canActivate$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
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
        const canActivateChild$ = autoLoginAllRoutesGuard.canActivateChild(null, {
          url: 'some-url1',
        } as RouterStateSnapshot) as Observable<boolean>;

        canActivateChild$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, 'some-url1');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
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
        const canActivateChild$ = autoLoginAllRoutesGuard.canActivateChild(null, {
          url: 'some-url1',
        } as RouterStateSnapshot) as Observable<boolean>;

        canActivateChild$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
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
        const canLoad$ = autoLoginAllRoutesGuard.canLoad(null, []) as Observable<boolean>;
        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, '');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
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
        const canLoad$ = autoLoginAllRoutesGuard.canLoad(null, [
          new UrlSegment('some-url12', {}),
          new UrlSegment('with', {}),
          new UrlSegment('some-param', {}),
        ]) as Observable<boolean>;

        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, 'some-url12/with/some-param');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
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
        const canLoad$ = autoLoginAllRoutesGuard.canLoad(null, []) as Observable<boolean>;

        canLoad$.subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      })
    );
  });
});
