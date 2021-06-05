import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthStateService } from './authState/auth-state.service';
import { AuthStateServiceMock } from './authState/auth-state.service-mock';
import { AutoLoginService } from './auto-login/auto-login.service';
import { CallbackService } from './callback/callback.service';
import { CallbackServiceMock } from './callback/callback.service-mock';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { PeriodicallyTokenCheckServiceMock } from './callback/periodically-token-check.service-mock';
import { RefreshSessionService } from './callback/refresh-session.service';
import { RefreshSessionServiceMock } from './callback/refresh-session.service.mock';
import { CheckAuthService } from './check-auth.service';
import { StsConfigLoader } from './config/loader/config-loader';
import { StsConfigLoaderMock } from './config/loader/config-loader-mock';
import { ConfigurationProvider } from './config/provider/config.provider';
import { ConfigurationProviderMock } from './config/provider/config.provider-mock';
import { CheckSessionService } from './iframe/check-session.service';
import { CheckSessionServiceMock } from './iframe/check-session.service-mock';
import { SilentRenewService } from './iframe/silent-renew.service';
import { SilentRenewServiceMock } from './iframe/silent-renew.service-mock';
import { LoggerService } from './logging/logger.service';
import { LoggerServiceMock } from './logging/logger.service-mock';
import { PopUpService } from './login/popup/popup.service';
import { PopUpServiceMock } from './login/popup/popup.service-mock';
import { StoragePersistenceService } from './storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from './storage/storage-persistence.service-mock';
import { UserServiceMock } from './userData/user-service-mock';
import { UserService } from './userData/user.service';
import { CurrentUrlService } from './utils/url/current-url.service';
import { CurrentUrlServiceMock } from './utils/url/current-url.service-mock';

describe('CheckAuthService', () => {
  let checkAuthService: CheckAuthService;
  let configurationProvider: ConfigurationProvider;
  let authStateService: AuthStateService;
  let userService: UserService;
  let checkSessionService: CheckSessionService;
  let callBackService: CallbackService;
  let silentRenewService: SilentRenewService;
  let periodicallyTokenCheckService: PeriodicallyTokenCheckService;
  let refreshSessionService: RefreshSessionService;
  let popUpService: PopUpService;
  let autoLoginService: AutoLoginService;
  let router: Router;
  let storagePersistenceService: StoragePersistenceService;
  let currentUrlService: CurrentUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: CheckSessionService, useClass: CheckSessionServiceMock },
        { provide: SilentRenewService, useClass: SilentRenewServiceMock },
        { provide: UserService, useClass: UserServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: CallbackService, useClass: CallbackServiceMock },
        { provide: RefreshSessionService, useClass: RefreshSessionServiceMock },
        { provide: PeriodicallyTokenCheckService, useClass: PeriodicallyTokenCheckServiceMock },
        { provide: PopUpService, useClass: PopUpServiceMock },
        { provide: StsConfigLoader, useClass: StsConfigLoaderMock },
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        AutoLoginService,
        CheckAuthService,
        {
          provide: CurrentUrlService,
          useClass: CurrentUrlServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    checkAuthService = TestBed.inject(CheckAuthService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    refreshSessionService = TestBed.inject(RefreshSessionService);
    userService = TestBed.inject(UserService);
    authStateService = TestBed.inject(AuthStateService);
    checkSessionService = TestBed.inject(CheckSessionService);
    callBackService = TestBed.inject(CallbackService);
    silentRenewService = TestBed.inject(SilentRenewService);
    periodicallyTokenCheckService = TestBed.inject(PeriodicallyTokenCheckService);
    popUpService = TestBed.inject(PopUpService);
    autoLoginService = TestBed.inject(AutoLoginService);
    router = TestBed.inject(Router);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    currentUrlService = TestBed.inject(CurrentUrlService);
  });

  afterEach(() => {
    storagePersistenceService.clear();
  });

  it('should create', () => {
    expect(checkAuthService).toBeTruthy();
  });

  describe('checkAuth', () => {
    it('uses config with matching state when url has state param and config with state param is stored', () => {
      spyOn(currentUrlService, 'currentUrlHasStateParam').and.returnValue(true);
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue('the-state-param');

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ configId: 'configId', stsServer: 'some-stsserver' }]);
      spyOn(storagePersistenceService, 'read').withArgs('authStateControl', 'configId').and.returnValue('the-state-param');

      const spy = spyOn(checkAuthService as any, 'checkAuthWithConfig').and.callThrough();

      checkAuthService.checkAuth().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith({ configId: 'configId', stsServer: 'some-stsserver' }, undefined);
      });
    });

    it('throws error when url has state param and stored config with matching state param is not found', () => {
      spyOn(currentUrlService, 'currentUrlHasStateParam').and.returnValue(true);
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue('the-state-param');

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ configId: 'configId', stsServer: 'some-stsserver' }]);
      spyOn(storagePersistenceService, 'read').withArgs('authStateControl', 'configId').and.returnValue('not-matching-state-param');

      const spy = spyOn(checkAuthService as any, 'checkAuthWithConfig').and.callThrough();

      checkAuthService.checkAuth().subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          expect(spy).not.toHaveBeenCalled();
        },
      });
    });

    it('uses first/default config when no param is passed', () => {
      spyOn(currentUrlService, 'currentUrlHasStateParam').and.returnValue(false);

      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId', stsServer: 'some-stsserver' });

      const spy = spyOn(checkAuthService as any, 'checkAuthWithConfig').and.callThrough();

      checkAuthService.checkAuth().subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith({ configId: 'configId', stsServer: 'some-stsserver' }, undefined);
      });
    });

    it(
      'returns isAuthenticated: false with error message when config is not valid',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(false);
        checkAuthService.checkAuth('configId').subscribe((result) =>
          expect(result).toEqual({
            isAuthenticated: false,
            errorMessage: 'Please provide at least one configuration before setting up the module',
            configId: undefined,
            idToken: null,
            userData: null,
            accessToken: null,
          })
        );
      })
    );

    it(
      'returns null and sendMessageToMainWindow if currently in a popup',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(popUpService, 'isCurrentlyInPopup').and.returnValue(true);
        const popupSpy = spyOn(popUpService, 'sendMessageToMainWindow');
        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(result).toBeNull();
          expect(popupSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'returns isAuthenticated: false with error message in case handleCallbackAndFireEvents throws an error',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer', configId: 'configId' });
        spyOn(callBackService, 'isCallback').and.returnValue(true);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(throwError('ERROR'));
        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: false,
            errorMessage: 'ERROR',
            configId: 'configId',
            idToken: null,
            userData: null,
            accessToken: null,
          });
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'calls callbackService.handlePossibleStsCallback with current url when callback is true',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer', configId: 'configId' });
        spyOn(callBackService, 'isCallback').and.returnValue(true);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(result).toEqual({ isAuthenticated: true, userData: null, accessToken: null, configId: 'configId', idToken: null });
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'does NOT call handleCallbackAndFireEvents with current url when callback is false',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer', configId: 'configId' });
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(result).toEqual({ isAuthenticated: true, userData: null, accessToken: null, configId: 'configId', idToken: null });
          expect(spy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'does fire the auth and user data events when it is not a callback from the sts and is authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer', configId: 'configId' });
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

        const setAuthorizedAndFireEventSpy = spyOn(authStateService, 'setAuthenticatedAndFireEvent');
        const userServiceSpy = spyOn(userService, 'publishUserDataIfExists');
        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(result).toEqual({ isAuthenticated: true, userData: null, accessToken: null, configId: 'configId', idToken: null });
          expect(setAuthorizedAndFireEventSpy).toHaveBeenCalled();
          expect(userServiceSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'does NOT fire the auth and user data events when it is not a callback from the sts and is NOT authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer', configId: 'configId' });
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

        const setAuthorizedAndFireEventSpy = spyOn(authStateService, 'setAuthenticatedAndFireEvent');
        const userServiceSpy = spyOn(userService, 'publishUserDataIfExists');
        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(result).toEqual({ isAuthenticated: false, userData: null, accessToken: null, configId: 'configId', idToken: null });
          expect(setAuthorizedAndFireEventSpy).not.toHaveBeenCalled();
          expect(userServiceSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'if authenticated return true',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer', configId: 'configId' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(result).toEqual({ isAuthenticated: true, userData: null, accessToken: null, configId: 'configId', idToken: null });
        });
      })
    );

    it(
      'if authenticated set auth and fires event ',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        const spy = spyOn(authStateService, 'setAuthenticatedAndFireEvent');

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if authenticated publishUserdataIfExists',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        const spy = spyOn(userService, 'publishUserDataIfExists');

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if authenticated callbackService startTokenValidationPeriodically',
      waitForAsync(() => {
        const config = {
          stsServer: 'stsServer',
          tokenRefreshInSeconds: 7,
        };
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue(config);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        const spy = spyOn(periodicallyTokenCheckService, 'startTokenValidationPeriodically');

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if isCheckSessionConfigured call checkSessionService.start()',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        spyOn(checkSessionService, 'isCheckSessionConfigured').and.returnValue(true);
        const spy = spyOn(checkSessionService, 'start');

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if isSilentRenewConfigured call getOrCreateIframe()',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(true);
        const spy = spyOn(silentRenewService, 'getOrCreateIframe');

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'deletes route and navigates if a route for redirect was saved and user is authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        spyOn(autoLoginService, 'getStoredRedirectRoute').and.returnValue('some-saved-route');
        const deleteSpy = spyOn(autoLoginService, 'deleteStoredRedirectRoute');
        const routeSpy = spyOn(router, 'navigateByUrl');

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(deleteSpy).toHaveBeenCalledTimes(1);
          expect(routeSpy).toHaveBeenCalledOnceWith('some-saved-route');
        });
      })
    );

    it(
      'does not redirect when user is not authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        spyOn(autoLoginService, 'getStoredRedirectRoute').and.returnValue('some-saved-route');
        const deleteSpy = spyOn(autoLoginService, 'deleteStoredRedirectRoute');
        const routeSpy = spyOn(router, 'navigateByUrl');

        checkAuthService.checkAuth('configId').subscribe((result) => {
          expect(deleteSpy).toHaveBeenCalledTimes(0);
          expect(routeSpy).toHaveBeenCalledTimes(0);
        });
      })
    );
  });

  describe('checkAuthIncludingServer', () => {
    it(
      'if isSilentRenewConfigured call getOrCreateIframe()',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(true);
        const spy = spyOn(silentRenewService, 'getOrCreateIframe');

        checkAuthService.checkAuthIncludingServer('configId').subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'does forceRefreshSession get called and is NOT authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasAsLeastOneConfig').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ stsServer: 'stsServer' });
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

        spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
          of({
            idToken: 'idToken',
            accessToken: 'access_token',
            isAuthenticated: false,
            userData: null,
            configId: 'configId',
          })
        );

        checkAuthService.checkAuthIncludingServer('configId').subscribe((result) => {
          expect(result).toBeTruthy();
        });
      })
    );
  });

  describe('checkAuthMultiple', () => {
    it('uses config with matching state when url has state param and config with state param is stored', () => {
      spyOn(currentUrlService, 'currentUrlHasStateParam').and.returnValue(true);
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue('the-state-param');

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ configId: 'configId', stsServer: 'some-stsserver' }]);
      spyOn(storagePersistenceService, 'read').withArgs('authStateControl', 'configId').and.returnValue('the-state-param');

      const spy = spyOn(checkAuthService as any, 'checkAuthWithConfig').and.callThrough();

      checkAuthService.checkAuthMultiple().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy).toHaveBeenCalledOnceWith({ configId: 'configId', stsServer: 'some-stsserver' }, undefined);
      });
    });

    it('uses config from passed configId if configId was passed', () => {
      spyOn(currentUrlService, 'currentUrlHasStateParam').and.returnValue(false);

      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId', stsServer: 'some-stsserver' });

      const spy = spyOn(checkAuthService as any, 'checkAuthWithConfig').and.callThrough();

      checkAuthService.checkAuthMultiple('configId').subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy).toHaveBeenCalledOnceWith({ configId: 'configId', stsServer: 'some-stsserver' }, undefined);
      });
    });

    it('runs through all configs if no parameter is passed and has no state in url', () => {
      spyOn(currentUrlService, 'currentUrlHasStateParam').and.returnValue(false);

      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([
        { configId: 'configId1', stsServer: 'some-stsserver1' },
        { configId: 'configId2', stsServer: 'some-stsserver2' },
      ]);

      const spy = spyOn(checkAuthService as any, 'checkAuthWithConfig').and.callThrough();

      checkAuthService.checkAuthMultiple().subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith({ configId: 'configId1', stsServer: 'some-stsserver1' }, undefined);
        expect(spy).toHaveBeenCalledWith({ configId: 'configId2', stsServer: 'some-stsserver2' }, undefined);
      });
    });
  });
});
