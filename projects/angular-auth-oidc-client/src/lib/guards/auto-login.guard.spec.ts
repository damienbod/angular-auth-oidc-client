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
import { AutoLoginGuard } from './auto-login.guard';

describe(`AutoLoginGuard`, () => {
  let autoLoginGuard: AutoLoginGuard;
  let checkAuthService: CheckAuthService;
  let loginService: LoginService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        {
          provide: LoginService,
          useClass: LoginServiceMock,
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
    router = TestBed.inject(Router);
    loginService = TestBed.inject(LoginService);

    localStorage.clear();
  });

  it('should create', () => {
    expect(autoLoginGuard).toBeTruthy();
  });

  describe('canActivate', () => {
    it(
      'should call checkAuth',
      waitForAsync(() => {
        const checkAuthServiceSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

        autoLoginGuard.canActivate(null, { url: 'some-url' } as RouterStateSnapshot).subscribe(() => {
          expect(checkAuthServiceSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'should call loginService.login() when not authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        const loginSpy = spyOn(loginService, 'login');

        autoLoginGuard.canActivate(null, { url: 'some-url' } as RouterStateSnapshot).subscribe(() => {
          expect(loginSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'should return false when not authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

        autoLoginGuard.canActivate(null, { url: 'some-url' } as RouterStateSnapshot).subscribe((result) => {
          expect(result).toBe(false);
        });
      })
    );

    it(
      'if no route is stored, setItem on localStorage is called',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
        const localStorageSpy = spyOn(localStorage, 'setItem');

        autoLoginGuard.canActivate(null, { url: 'some-url' } as RouterStateSnapshot).subscribe((result) => {
          expect(localStorageSpy).toHaveBeenCalledOnceWith('redirect', 'some-url');
        });
      })
    );

    it(
      'returns true if authorized',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(true));
        const localStorageSpy = spyOn(localStorage, 'setItem');

        autoLoginGuard.canActivate(null, { url: 'some-url' } as RouterStateSnapshot).subscribe((result) => {
          expect(result).toBe(true);
          expect(localStorageSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'if authorized and stored route exists: remove item, navigate to route and return true',
      waitForAsync(() => {
        spyOn(checkAuthService, 'checkAuth').and.returnValue(of(true));
        spyOn(localStorage, 'getItem').and.returnValue('stored-route');
        const localStorageSpy = spyOn(localStorage, 'removeItem');
        const routerSpy = spyOn(router, 'navigate');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginGuard.canActivate(null, { url: 'some-url' } as RouterStateSnapshot).subscribe((result) => {
          expect(result).toBe(true);
          expect(localStorageSpy).toHaveBeenCalledOnceWith('redirect');
          expect(routerSpy).toHaveBeenCalledOnceWith(['stored-route']);
          expect(loginSpy).not.toHaveBeenCalled();
        });
      })
    );
  });
});
