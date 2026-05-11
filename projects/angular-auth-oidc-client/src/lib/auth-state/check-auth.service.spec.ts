import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { mockAbstractProvider, mockProvider } from '../../test/auto-mock';
import { AutoLoginService } from '../auto-login/auto-login.service';
import { CallbackService } from '../callback/callback.service';
import { PeriodicallyTokenCheckService } from '../callback/periodically-token-check.service';
import { RefreshSessionService } from '../callback/refresh-session.service';
import {
  StsConfigLoader,
  StsConfigStaticLoader,
} from '../config/loader/config-loader';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { CheckSessionService } from '../iframe/check-session.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { LoginResponse } from '../login/login-response';
import { PopUpService } from '../login/popup/popup.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../user-data/user.service';
import { CurrentUrlService } from '../utils/url/current-url.service';
import { AuthStateService } from './auth-state.service';
import { CheckAuthService } from './check-auth.service';

describe('CheckAuthService', () => {
  let checkAuthService: CheckAuthService;
  let authStateService: AuthStateService;
  let userService: UserService;
  let checkSessionService: CheckSessionService;
  let callBackService: CallbackService;
  let silentRenewService: SilentRenewService;
  let periodicallyTokenCheckService: PeriodicallyTokenCheckService;
  let refreshSessionService: RefreshSessionService;
  let popUpService: PopUpService;
  let autoLoginService: AutoLoginService;
  let storagePersistenceService: StoragePersistenceService;
  let currentUrlService: CurrentUrlService;
  let publicEventsService: PublicEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        mockProvider(CheckSessionService),
        mockProvider(SilentRenewService),
        mockProvider(UserService),
        mockProvider(LoggerService),
        mockProvider(AuthStateService),
        mockProvider(CallbackService),
        mockProvider(RefreshSessionService),
        mockProvider(PeriodicallyTokenCheckService),
        mockProvider(PopUpService),
        mockProvider(CurrentUrlService),
        mockProvider(PublicEventsService),
        mockAbstractProvider(StsConfigLoader, StsConfigStaticLoader),
        AutoLoginService,
        mockProvider(StoragePersistenceService),
      ],
    });
  });

  beforeEach(() => {
    checkAuthService = TestBed.inject(CheckAuthService);
    refreshSessionService = TestBed.inject(RefreshSessionService);
    userService = TestBed.inject(UserService);
    authStateService = TestBed.inject(AuthStateService);
    checkSessionService = TestBed.inject(CheckSessionService);
    callBackService = TestBed.inject(CallbackService);
    silentRenewService = TestBed.inject(SilentRenewService);
    periodicallyTokenCheckService = TestBed.inject(
      PeriodicallyTokenCheckService
    );
    popUpService = TestBed.inject(PopUpService);
    autoLoginService = TestBed.inject(AutoLoginService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    currentUrlService = TestBed.inject(CurrentUrlService);
    publicEventsService = TestBed.inject(PublicEventsService);
  });

  afterEach(() => {
    storagePersistenceService.clear({} as OpenIdConfiguration);
  });

  it('should create', () => {
    expect(checkAuthService).toBeTruthy();
  });

  describe('checkAuth', () => {
    it('uses config with matching state when url has state param and config with state param is stored', waitForAsync(() => {
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue(
        'the-state-param'
      );
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(storagePersistenceService, 'read')
        .withArgs('authStateControl', allConfigs[0])
        .and.returnValue('the-state-param');
      const spy = spyOn(
        checkAuthService as any,
        'checkAuthWithConfig'
      ).and.callThrough();

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(
          allConfigs[0],
          allConfigs,
          undefined
        );
      });
    }));

    it('throws error when url has state param and stored config with matching state param is not found', waitForAsync(() => {
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue(
        'the-state-param'
      );
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(storagePersistenceService, 'read')
        .withArgs('authStateControl', allConfigs[0])
        .and.returnValue('not-matching-state-param');
      const spy = spyOn(
        checkAuthService as any,
        'checkAuthWithConfig'
      ).and.callThrough();

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          expect(spy).not.toHaveBeenCalled();
        },
      });
    }));

    it('uses first/default config when no param is passed', waitForAsync(() => {
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue(
        null
      );
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];
      const spy = spyOn(
        checkAuthService as any,
        'checkAuthWithConfig'
      ).and.callThrough();

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith(
          { configId: 'configId1', authority: 'some-authority' },
          allConfigs,
          undefined
        );
      });
    }));

    it('returns null and sendMessageToMainWindow if currently in a popup', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(popUpService as any, 'canAccessSessionStorage').and.returnValue(
        true
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOnProperty(popUpService as any, 'windowInternal').and.returnValue({
        opener: {} as Window,
      });
      spyOn(storagePersistenceService, 'read').and.returnValue(null);

      spyOn(popUpService, 'isCurrentlyInPopup').and.returnValue(true);
      const popupSpy = spyOn(popUpService, 'sendMessageToMainWindow');

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: false,
            errorMessage: '',
            userData: null,
            idToken: '',
            accessToken: '',
            configId: '',
          });
          expect(popupSpy).toHaveBeenCalled();
        });
    }));

    it('returns isAuthenticated: false with error message in case handleCallbackAndFireEvents throws an error', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(true);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );

      const spy = spyOn(
        callBackService,
        'handleCallbackAndFireEvents'
      ).and.returnValue(throwError(() => new Error('ERROR')));

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: false,
            errorMessage: 'ERROR',
            oidcError: undefined,
            configId: 'configId1',
            idToken: '',
            userData: null,
            accessToken: '',
          });
          expect(spy).toHaveBeenCalled();
        });
    }));

    it('calls callbackService.handlePossibleStsCallback with current url when callback is true', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(true);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(authStateService, 'getAccessToken').and.returnValue('at');
      spyOn(authStateService, 'getIdToken').and.returnValue('idt');

      const spy = spyOn(
        callBackService,
        'handleCallbackAndFireEvents'
      ).and.returnValue(of({} as CallbackContext));

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: true,
            userData: undefined,
            accessToken: 'at',
            configId: 'configId1',
            idToken: 'idt',
          });
          expect(spy).toHaveBeenCalled();
        });
    }));

    it('does NOT call handleCallbackAndFireEvents with current url when callback is false', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(false);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );

      const spy = spyOn(
        callBackService,
        'handleCallbackAndFireEvents'
      ).and.returnValue(of({} as CallbackContext));

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(authStateService, 'getAccessToken').and.returnValue('at');
      spyOn(authStateService, 'getIdToken').and.returnValue('idt');

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: true,
            userData: undefined,
            accessToken: 'at',
            configId: 'configId1',
            idToken: 'idt',
          });
          expect(spy).not.toHaveBeenCalled();
        });
    }));

    it('does fire the auth and user data events when it is not a callback from the security token service and is authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(false);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(userService, 'getUserDataFromStore').and.returnValue({
        some: 'user-data',
      });
      spyOn(authStateService, 'getAccessToken').and.returnValue('at');
      spyOn(authStateService, 'getIdToken').and.returnValue('idt');

      const setAuthorizedAndFireEventSpy = spyOn(
        authStateService,
        'setAuthenticatedAndFireEvent'
      );
      const userServiceSpy = spyOn(userService, 'publishUserDataIfExists');

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: true,
            userData: {
              some: 'user-data',
            },
            accessToken: 'at',
            configId: 'configId1',
            idToken: 'idt',
          });
          expect(setAuthorizedAndFireEventSpy).toHaveBeenCalled();
          expect(userServiceSpy).toHaveBeenCalled();
        });
    }));

    it('does NOT fire the auth and user data events when it is not a callback from the security token service and is NOT authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(false);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOn(authStateService, 'getAccessToken').and.returnValue('at');
      spyOn(authStateService, 'getIdToken').and.returnValue('it');
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );

      const setAuthorizedAndFireEventSpy = spyOn(
        authStateService,
        'setAuthenticatedAndFireEvent'
      );
      const userServiceSpy = spyOn(userService, 'publishUserDataIfExists');

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: false,
            userData: undefined,
            accessToken: 'at',
            configId: 'configId1',
            idToken: 'it',
          });
          expect(setAuthorizedAndFireEventSpy).not.toHaveBeenCalled();
          expect(userServiceSpy).not.toHaveBeenCalled();
        });
    }));

    it('if authenticated return true', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(authStateService, 'getAccessToken').and.returnValue('at');
      spyOn(authStateService, 'getIdToken').and.returnValue('idt');
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: true,
            userData: undefined,
            accessToken: 'at',
            configId: 'configId1',
            idToken: 'idt',
          });
        });
    }));

    it('if authenticated set auth and fires event ', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(callBackService, 'isCallback').and.returnValue(false);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );

      const spy = spyOn(authStateService, 'setAuthenticatedAndFireEvent');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('if authenticated publishUserdataIfExists', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );

      const spy = spyOn(userService, 'publishUserDataIfExists');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('if authenticated callbackService startTokenValidationPeriodically', waitForAsync(() => {
      const config = {
        authority: 'authority',
        tokenRefreshInSeconds: 7,
      };
      const allConfigs = [config];

      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      const spy = spyOn(
        periodicallyTokenCheckService,
        'startTokenValidationPeriodically'
      );

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('if isCheckSessionConfigured call checkSessionService.start()', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(checkSessionService, 'isCheckSessionConfigured').and.returnValue(
        true
      );
      const spy = spyOn(checkSessionService, 'start');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('if isSilentRenewConfigured call getOrCreateIframe()', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(
        true
      );
      const spy = spyOn(silentRenewService, 'getOrCreateIframe');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('calls checkSavedRedirectRouteAndNavigate if authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      const spy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledOnceWith(allConfigs[0]);
      });
    }));

    it('does not call checkSavedRedirectRouteAndNavigate if not authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      const spy = spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(0);
      });
    }));

    it('fires CheckingAuth-Event on start and finished event on end', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );

      const fireEventSpy = spyOn(publicEventsService, 'fireEvent');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(fireEventSpy.calls.allArgs()).toEqual([
          [EventTypes.CheckingAuth],
          [EventTypes.CheckingAuthFinished],
        ]);
      });
    }));

    it('fires CheckingAuth-Event on start and CheckingAuthFinishedWithError event on end if exception occurs', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];
      const fireEventSpy = spyOn(publicEventsService, 'fireEvent');

      spyOn(callBackService, 'isCallback').and.returnValue(true);
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        throwError(() => new Error('ERROR'))
      );
      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(fireEventSpy.calls.allArgs()).toEqual([
          [EventTypes.CheckingAuth],
          [EventTypes.CheckingAuthFinishedWithError, 'ERROR'],
        ]);
      });
    }));

    it('fires CheckingAuth-Event on start and finished event on end if not authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(currentUrlService, 'getCurrentUrl').and.returnValue(
        'http://localhost:4200'
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );

      const fireEventSpy = spyOn(publicEventsService, 'fireEvent');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(fireEventSpy.calls.allArgs()).toEqual([
          [EventTypes.CheckingAuth],
          [EventTypes.CheckingAuthFinished],
        ]);
      });
    }));
  });

  describe('checkAuthIncludingServer', () => {
    it('if isSilentRenewConfigured call getOrCreateIframe()', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
        of({ isAuthenticated: true } as LoginResponse)
      );

      spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(
        true
      );
      const spy = spyOn(silentRenewService, 'getOrCreateIframe');

      checkAuthService
        .checkAuthIncludingServer(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
    }));

    it('does forceRefreshSession get called and is NOT authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(false);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );

      spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
        of({
          idToken: 'idToken',
          accessToken: 'access_token',
          isAuthenticated: false,
          userData: null,
          configId: 'configId1',
        })
      );

      checkAuthService
        .checkAuthIncludingServer(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toBeTruthy();
        });
    }));

    it('should start check session and validation after forceRefreshSession has been called and is authenticated after forcing with silentrenew', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(false);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(checkSessionService, 'isCheckSessionConfigured').and.returnValue(
        true
      );
      spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(
        true
      );

      const checkSessionServiceStartSpy = spyOn(checkSessionService, 'start');
      const periodicallyTokenCheckServiceSpy = spyOn(
        periodicallyTokenCheckService,
        'startTokenValidationPeriodically'
      );
      const getOrCreateIframeSpy = spyOn(
        silentRenewService,
        'getOrCreateIframe'
      );

      spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
        of({
          idToken: 'idToken',
          accessToken: 'access_token',
          isAuthenticated: true,
          userData: null,
          configId: 'configId1',
        })
      );

      checkAuthService
        .checkAuthIncludingServer(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(checkSessionServiceStartSpy).toHaveBeenCalledOnceWith(
            allConfigs[0]
          );
          expect(periodicallyTokenCheckServiceSpy).toHaveBeenCalledTimes(1);
          expect(getOrCreateIframeSpy).toHaveBeenCalledOnceWith(allConfigs[0]);
        });
    }));

    it('should start check session and validation after forceRefreshSession has been called and is authenticated after forcing without silentrenew', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      spyOn(callBackService, 'isCallback').and.returnValue(false);
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOn(callBackService, 'handleCallbackAndFireEvents').and.returnValue(
        of({} as CallbackContext)
      );
      spyOn(checkSessionService, 'isCheckSessionConfigured').and.returnValue(
        true
      );
      spyOn(silentRenewService, 'isSilentRenewConfigured').and.returnValue(
        false
      );

      const checkSessionServiceStartSpy = spyOn(checkSessionService, 'start');
      const periodicallyTokenCheckServiceSpy = spyOn(
        periodicallyTokenCheckService,
        'startTokenValidationPeriodically'
      );
      const getOrCreateIframeSpy = spyOn(
        silentRenewService,
        'getOrCreateIframe'
      );

      spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
        of({
          idToken: 'idToken',
          accessToken: 'access_token',
          isAuthenticated: true,
          userData: null,
          configId: 'configId1',
        })
      );

      checkAuthService
        .checkAuthIncludingServer(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(checkSessionServiceStartSpy).toHaveBeenCalledOnceWith(
            allConfigs[0]
          );
          expect(periodicallyTokenCheckServiceSpy).toHaveBeenCalledTimes(1);
          expect(getOrCreateIframeSpy).not.toHaveBeenCalled();
        });
    }));
  });

  describe('checkAuthMultiple', () => {
    it('uses config with matching state when url has state param and config with state param is stored', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority1' },
        { configId: 'configId2', authority: 'some-authority2' },
      ];

      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue(
        'the-state-param'
      );
      spyOn(storagePersistenceService, 'read')
        .withArgs('authStateControl', allConfigs[0])
        .and.returnValue('the-state-param');
      const spy = spyOn(
        checkAuthService as any,
        'checkAuthWithConfig'
      ).and.callThrough();

      checkAuthService.checkAuthMultiple(allConfigs).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual([
          allConfigs[0],
          allConfigs,
          undefined,
        ]);
        expect(spy.calls.argsFor(1)).toEqual([
          allConfigs[1],
          allConfigs,
          undefined,
        ]);
      });
    }));

    it('uses config from passed configId if configId was passed and returns all results', waitForAsync(() => {
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue(
        null
      );

      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority1' },
        { configId: 'configId2', authority: 'some-authority2' },
      ];
      const spy = spyOn(
        checkAuthService as any,
        'checkAuthWithConfig'
      ).and.callThrough();

      checkAuthService.checkAuthMultiple(allConfigs).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy.calls.allArgs()).toEqual([
          [
            { configId: 'configId1', authority: 'some-authority1' },
            allConfigs,
            undefined,
          ],
          [
            { configId: 'configId2', authority: 'some-authority2' },
            allConfigs,
            undefined,
          ],
        ]);
      });
    }));

    it('runs through all configs if no parameter is passed and has no state in url', waitForAsync(() => {
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue(
        null
      );

      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority1' },
        { configId: 'configId2', authority: 'some-authority2' },
      ];
      const spy = spyOn(
        checkAuthService as any,
        'checkAuthWithConfig'
      ).and.callThrough();

      checkAuthService.checkAuthMultiple(allConfigs).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy.calls.argsFor(0)).toEqual([
          { configId: 'configId1', authority: 'some-authority1' },
          allConfigs,
          undefined,
        ]);
        expect(spy.calls.argsFor(1)).toEqual([
          { configId: 'configId2', authority: 'some-authority2' },
          allConfigs,
          undefined,
        ]);
      });
    }));

    it('throws error if url has state param but no config could be found', waitForAsync(() => {
      spyOn(currentUrlService, 'getStateParamFromCurrentUrl').and.returnValue(
        'the-state-param'
      );

      const allConfigs: OpenIdConfiguration[] = [];

      checkAuthService.checkAuthMultiple(allConfigs).subscribe({
        error: (error) => {
          expect(error.message).toEqual(
            'could not find matching config for state the-state-param'
          );
        },
      });
    }));
  });
});
