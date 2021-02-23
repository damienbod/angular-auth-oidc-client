import { HttpClientModule } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthModule } from './auth.module';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { CallbackServiceMock } from './callback/callback.service-mock';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { PeriodicallyTokenCheckServiceMock } from './callback/periodically-token-check.service-mock';
import { RefreshSessionService } from './callback/refresh-session.service';
import { RefreshSessionServiceMock } from './callback/refresh-session.service.mock';
import { CheckAuthService } from './check-auth.service';
import { ConfigurationProvider } from './config/config.provider';
import { CheckSessionService } from './iframe/check-session.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { SilentRenewServiceMock } from './iframe/silent-renew.service-mock';
import { LoggerService } from './logging/logger.service';
import { LoggerServiceMock } from './logging/logger.service-mock';
import { PopUpService } from './login/popup/popup.service';
import { UserService } from './userData/user-service';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
      providers: [
        CheckSessionService,
        { provide: SilentRenewService, useClass: SilentRenewServiceMock },
        UserService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        ConfigurationProvider,
        AuthStateService,
        { provide: CallbackService, useClass: CallbackServiceMock },
        { provide: RefreshSessionService, useClass: RefreshSessionServiceMock },
        { provide: PeriodicallyTokenCheckService, useClass: PeriodicallyTokenCheckServiceMock },
        PopUpService,
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
  });

  it('should create', () => {
    expect(checkAuthService).toBeTruthy();
  });

  describe('checkAuth', () => {
    it(
      'returns false when config is not valid',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(false);
        checkAuthService.checkAuth().subscribe((result) => expect(result).toBeFalse());
      })
    );

    it(
      'returns false in case handleCallbackAndFireEvents throws an error',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'isCallback').and.returnValue(true);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(throwError('ERROR'));
        checkAuthService.checkAuth().subscribe((result) => {
          expect(result).toBeFalse();
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'calls callbackService.handlePossibleStsCallback with current url when callback is true',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'isCallback').and.returnValue(true);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        checkAuthService.checkAuth().subscribe((result) => {
          expect(result).toBeTrue();
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'does NOT call handleCallbackAndFireEvents with current url when callback is false',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        const spy = spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        checkAuthService.checkAuth().subscribe((result) => {
          expect(result).toBeFalse();
          expect(spy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'does fire the auth and user data events when it is not a callback from the sts and is authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

        const setAuthorizedAndFireEventSpy = spyOn(authStateService, 'setAuthorizedAndFireEvent');
        const userServiceSpy = spyOn(userService, 'publishUserDataIfExists');
        checkAuthService.checkAuth().subscribe((result) => {
          expect(result).toBeTrue();
          expect(setAuthorizedAndFireEventSpy).toHaveBeenCalled();
          expect(userServiceSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'does NOT fire the auth and user data events when it is not a callback from the sts and is NOT authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

        const setAuthorizedAndFireEventSpy = spyOn(authStateService, 'setAuthorizedAndFireEvent');
        const userServiceSpy = spyOn(userService, 'publishUserDataIfExists');
        checkAuthService.checkAuth().subscribe((result) => {
          expect(result).toBeFalse();
          expect(setAuthorizedAndFireEventSpy).not.toHaveBeenCalled();
          expect(userServiceSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'if authenticated return true',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        checkAuthService.checkAuth().subscribe((result) => {
          expect(result).toBeTrue();
        });
      })
    );

    it(
      'if authenticated set auth and fires event ',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        const spy = spyOn(authStateService, 'setAuthorizedAndFireEvent');

        checkAuthService.checkAuth().subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if authenticated publishUserdataIfExists ',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        const spy = spyOn(userService, 'publishUserDataIfExists');

        checkAuthService.checkAuth().subscribe((result) => {
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
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue(config);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        const spy = spyOn(periodicallyTokenCheckService, 'startTokenValidationPeriodically');

        checkAuthService.checkAuth().subscribe((result) => {
          expect(spy).toHaveBeenCalledWith(7);
        });
      })
    );

    it(
      'if isCheckSessionConfigured call checkSessionService.start()',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        spyOn(checkSessionService, 'isCheckSessionConfigured').and.returnValue(true);
        const spy = spyOn(checkSessionService, 'start');

        checkAuthService.checkAuth().subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'if isSilentRenewConfigured call getOrCreateIframe()',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(true);
        const spy = spyOn(silentRenewService, 'getOrCreateIframe');

        checkAuthService.checkAuth().subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );
  });

  describe('checkAuthIncludingServer', () => {
    it(
      'if isSilentRenewConfigured call getOrCreateIframe()',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

        spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(true);
        const spy = spyOn(silentRenewService, 'getOrCreateIframe');

        checkAuthService.checkAuthIncludingServer().subscribe((result) => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'does forceRefreshSession get called and is NOT authenticated',
      waitForAsync(() => {
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        spyOn(callBackService, 'isCallback').and.returnValue(false);
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);
        spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(of(null));

        spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
          of({
            idToken: 'idToken',
            accessToken: 'access_token',
          })
        );

        checkAuthService.checkAuthIncludingServer().subscribe((result) => {
          expect(result).toBeTruthy();
        });
      })
    );
  });
});
