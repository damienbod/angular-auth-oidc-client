import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { CheckAuthService } from '../auth-state/check-auth.service';
import { ConfigurationService } from '../config/config.service';
import { LoginService } from '../login/login.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { AutoLoginPartialRoutesGuard } from './auto-login-partial-routes.guard';
import { AutoLoginService } from './auto-login.service';
import { PeriodicallyTokenCheckService } from "../callback/periodically-token-check.service";
import { HttpClientTestingModule } from "@angular/common/http/testing";

describe(`AutoLoginPartialRoutesGuard`, () => {
  let autoLoginPartialRoutesGuard: AutoLoginPartialRoutesGuard;
  let loginService: LoginService;
  let authStateService: AuthStateService;
  let storagePersistenceService: StoragePersistenceService;
  let configurationService: ConfigurationService;
  let autoLoginService: AutoLoginService;
  let periodicallyTokenCheckService: PeriodicallyTokenCheckService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        AutoLoginService,
        { provide: AuthStateService, useClass: mockClass(AuthStateService) },
        {
          provide: LoginService,
          useClass: mockClass(LoginService),
        },
        {
          provide: StoragePersistenceService,
          useClass: mockClass(StoragePersistenceService),
        },
        {
          provide: CheckAuthService,
          useClass: mockClass(CheckAuthService),
        },
        {
          provide: ConfigurationService,
          useClass: mockClass(ConfigurationService),
        },
        {
          provide: PeriodicallyTokenCheckService,
          useClass: PeriodicallyTokenCheckService
        }
      ],
    });
  });

  beforeEach(() => {
    const config = { configId: 'configId1' };

    authStateService = TestBed.inject(AuthStateService);
    loginService = TestBed.inject(LoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    configurationService = TestBed.inject(ConfigurationService);
    periodicallyTokenCheckService = TestBed.inject(PeriodicallyTokenCheckService);

    spyOn(configurationService, 'getOpenIDConfigurations').and.returnValue(of({ allConfigs: [config], currentConfig: config }));

    autoLoginPartialRoutesGuard = TestBed.inject(AutoLoginPartialRoutesGuard);
    autoLoginService = TestBed.inject(AutoLoginService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    storagePersistenceService.clear(null);
  });

  it('should create', () => {
    expect(autoLoginPartialRoutesGuard).toBeTruthy();
  });

  describe('canActivate', () => {
    it(
      'should save current route and call `login` if not authenticated already',
      waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const startTokenValidationPeriodicallySpy = spyOn(periodicallyTokenCheckService, 'startTokenValidationPeriodically');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginPartialRoutesGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, 'some-url1');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
          expect(startTokenValidationPeriodicallySpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should call `checkSavedRedirectRouteAndNavigate` if authenticated already',
      waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginPartialRoutesGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      })
    );

    it(
      'should call `startTokenValidationPeriodically` if authenticated already',
      waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const startTokenValidationPeriodicallySpy = spyOn(periodicallyTokenCheckService, 'startTokenValidationPeriodically');

        autoLoginPartialRoutesGuard.canActivate(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(startTokenValidationPeriodicallySpy).toHaveBeenCalled();
        });
      })
    );
  });

  describe('canActivateChild', () => {
    it(
      'should save current route and call `login` if not authenticated already',
      waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginPartialRoutesGuard.canActivateChild(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, 'some-url1');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should call `checkSavedRedirectRouteAndNavigate` if authenticated already',
      waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginPartialRoutesGuard.canActivateChild(null, { url: 'some-url1' } as RouterStateSnapshot).subscribe(() => {
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
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginPartialRoutesGuard.canLoad().subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, '');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should save current route (with router extractedUrl) and call `login` if not authenticated already',
      waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');
        const _routerSpy = spyOn(router, 'getCurrentNavigation').and.returnValue({
          extractedUrl: router.parseUrl('some-url12/with/some-param?queryParam=true'),
          extras: {},
          id: 1,
          initialUrl: router.parseUrl(''),
          previousNavigation: null,
          trigger: 'imperative',
        });

        autoLoginPartialRoutesGuard.canLoad().subscribe(() => {
          expect(saveRedirectRouteSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' }, 'some-url12/with/some-param?queryParam=true');
          expect(loginSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
          expect(checkSavedRedirectRouteAndNavigateSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'should call `checkSavedRedirectRouteAndNavigate` if authenticated already',
      waitForAsync(() => {
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const checkSavedRedirectRouteAndNavigateSpy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');
        const saveRedirectRouteSpy = spyOn(autoLoginService, 'saveRedirectRoute');
        const loginSpy = spyOn(loginService, 'login');

        autoLoginPartialRoutesGuard.canLoad().subscribe(() => {
          expect(saveRedirectRouteSpy).not.toHaveBeenCalled();
          expect(loginSpy).not.toHaveBeenCalled();
          expect(checkSavedRedirectRouteAndNavigateSpy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
        });
      })
    );
  });
});
