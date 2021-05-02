import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { CheckAuthService } from '../check-auth.service';
import { CheckAuthServiceMock } from '../check-auth.service-mock';
import { LoginService } from '../login/login.service';
import { LoginServiceMock } from '../login/login.service-mock';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence-service-mock.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { AutoLoginGuard } from './auto-login.guard';
import { AutoLoginService } from './auto-login.service';

describe(`AutoLoginGuard`, () => {
  let autoLoginGuard: AutoLoginGuard;
  let checkAuthService: CheckAuthService;
  let loginService: LoginService;
  let authStateService: AuthStateService;
  let router: Router;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AutoLoginService,
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        {
          provide: LoginService,
          useClass: LoginServiceMock,
        },
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        {
          provide: CheckAuthService,
          useClass: CheckAuthServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    autoLoginGuard = TestBed.inject(AutoLoginGuard);
    checkAuthService = TestBed.inject(CheckAuthService);
    authStateService = TestBed.inject(AuthStateService);
    router = TestBed.inject(Router);
    loginService = TestBed.inject(LoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  afterEach(() => {
    storagePersistenceService.clear();
  });

  it('should create', () => {
    expect(autoLoginGuard).toBeTruthy();
  });

  describe('canActivate', () => {
    it(
      'should call checkAuth() if not authenticated already',
      waitForAsync(() => {
        const checkAuthServiceSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

        autoLoginGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(checkAuthServiceSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'should NOT call checkAuth() if authenticated already',
      waitForAsync(() => {
        const checkAuthServiceSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        spyOnProperty(authStateService, 'authorized$', 'get').and.returnValue(of(true));

        autoLoginGuard.canActivate(null, { url: 'some-url2' } as RouterStateSnapshot).subscribe(() => {
          expect(checkAuthServiceSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should call loginService.login() when not authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        const loginSpy = spyOn(loginService, 'login');

        autoLoginGuard.canActivate(null, { url: 'some-url3' } as RouterStateSnapshot).subscribe(() => {
          expect(loginSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'should return false when not authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

        autoLoginGuard.canActivate(null, { url: 'some-url4' } as RouterStateSnapshot).subscribe((result) => {
          expect(result).toBe(false);
        });
      })
    );

    it(
      'if no route is stored, write on StoragePersistenceService is called',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        const storageServiceSpy = spyOn(storagePersistenceService, 'write');

        autoLoginGuard.canActivate(null, { url: 'some-url5' } as RouterStateSnapshot).subscribe((result) => {
          expect(storageServiceSpy).toHaveBeenCalledOnceWith('redirect', 'some-url5');
        });
      })
    );

    it(
      'returns true if authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: true }));
        const storageServiceSpy = spyOn(storagePersistenceService, 'write');

        autoLoginGuard.canActivate(null, { url: 'some-url6' } as RouterStateSnapshot).subscribe((result) => {
          expect(result).toBe(true);
          expect(storageServiceSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'if authorized and stored route exists: remove item, navigate to route and return true',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: true }));
        spyOn(storagePersistenceService, 'read').and.returnValue('stored-route');
        const storageServiceSpy = spyOn(storagePersistenceService, 'remove');
        const routerSpy = spyOn(router, 'navigateByUrl');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginGuard.canActivate(null, { url: 'some-url7' } as RouterStateSnapshot).subscribe((result) => {
          expect(result).toBe(true);
          expect(storageServiceSpy).toHaveBeenCalledOnceWith('redirect');
          expect(routerSpy).toHaveBeenCalledOnceWith('stored-route');
          expect(loginSpy).not.toHaveBeenCalled();
        });
      })
    );
  });

  describe('canLoad', () => {
    it(
      'should call checkAuth() if not authenticated already',
      waitForAsync(() => {
        const checkAuthServiceSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

        autoLoginGuard.canLoad({ path: 'some-url8' }, []).subscribe(() => {
          expect(checkAuthServiceSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'should NOT call checkAuth() if authenticated already',
      waitForAsync(() => {
        const checkAuthServiceSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        spyOnProperty(authStateService, 'authorized$', 'get').and.returnValue(of(true));

        autoLoginGuard.canLoad({ path: 'some-url9' }, []).subscribe(() => {
          expect(checkAuthServiceSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should call loginService.login() when not authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        const loginSpy = spyOn(loginService, 'login');

        autoLoginGuard.canLoad({ path: 'some-url10' }, []).subscribe(() => {
          expect(loginSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'should return false when not authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

        autoLoginGuard.canLoad({ path: 'some-url11' }, []).subscribe((result) => {
          expect(result).toBe(false);
        });
      })
    );

    it(
      'if no route is stored, write on StoragePersistenceService is called',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        const storageServiceSpy = spyOn(storagePersistenceService, 'write');

        autoLoginGuard.canLoad({ path: 'some-url12' }, []).subscribe((result) => {
          expect(storageServiceSpy).toHaveBeenCalledOnceWith('redirect', 'some-url12');
        });
      })
    );

    it(
      'returns true if authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: true }));
        const storageServiceSpy = spyOn(storagePersistenceService, 'write');

        autoLoginGuard.canLoad({ path: 'some-url13' }, []).subscribe((result) => {
          expect(result).toBe(true);
          expect(storageServiceSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'if authorized and stored route exists: remove item, navigate to route and return true',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of({ isAuthenticated: true }));
        spyOn(storagePersistenceService, 'read').and.returnValue('stored-route');
        const storageServiceSpy = spyOn(storagePersistenceService, 'remove');
        const routerSpy = spyOn(router, 'navigateByUrl');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginGuard.canLoad({ path: 'some-url14' }, []).subscribe((result) => {
          expect(result).toBe(true);
          expect(storageServiceSpy).toHaveBeenCalledOnceWith('redirect');
          expect(routerSpy).toHaveBeenCalledOnceWith('stored-route');
          expect(loginSpy).not.toHaveBeenCalled();
        });
      })
    );
  });
});
