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
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue('the-state-param');
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authStateControl' && args[1] === allConfigs[0]) {
            return 'the-state-param';
          }

          return undefined;
        }
      );
      const spy = vi.spyOn(checkAuthService as any, 'checkAuthWithConfig');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(allConfigs[0], allConfigs, undefined);
      });
    }));

    it('throws error when url has state param and stored config with matching state param is not found', waitForAsync(() => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue('the-state-param');
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authStateControl' && args[1] === allConfigs[0]) {
            return 'not-matching-state-param';
          }

          return undefined;
        }
      );
      const spy = vi.spyOn(checkAuthService as any, 'checkAuthWithConfig');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          expect(spy).not.toHaveBeenCalled();
        },
      });
    }));

    it('uses first/default config when no param is passed', waitForAsync(() => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue(null);
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];
      const spy = vi.spyOn(checkAuthService as any, 'checkAuthWithConfig');

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(
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

      vi.spyOn(popUpService as any, 'canAccessSessionStorage').mockReturnValue(
        true
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(popUpService as any, 'windowInternal', 'get').mockReturnValue({
        opener: {} as Window,
      });
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(null);

      vi.spyOn(popUpService, 'isCurrentlyInPopup').mockReturnValue(true);
      const popupSpy = vi
        .spyOn(popUpService, 'sendMessageToMainWindow')
        .mockReturnValue(undefined);

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

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(true);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );

      const spy = vi
        .spyOn(callBackService, 'handleCallbackAndFireEvents')
        .mockReturnValue(throwError(() => new Error('ERROR')));

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );

      checkAuthService
        .checkAuth(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: false,
            errorMessage: 'ERROR',
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

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(true);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue('at');
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idt');

      const spy = vi
        .spyOn(callBackService, 'handleCallbackAndFireEvents')
        .mockReturnValue(of({} as CallbackContext));

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

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );

      const spy = vi
        .spyOn(callBackService, 'handleCallbackAndFireEvents')
        .mockReturnValue(of({} as CallbackContext));

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue('at');
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idt');

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

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue({
        some: 'user-data',
      });
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue('at');
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idt');

      const setAuthorizedAndFireEventSpy = vi
        .spyOn(authStateService, 'setAuthenticatedAndFireEvent')
        .mockReturnValue(undefined);
      const userServiceSpy = vi
        .spyOn(userService, 'publishUserDataIfExists')
        .mockReturnValue(undefined);

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

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue('at');
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('it');
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );

      const setAuthorizedAndFireEventSpy = vi
        .spyOn(authStateService, 'setAuthenticatedAndFireEvent')
        .mockReturnValue(undefined);
      const userServiceSpy = vi
        .spyOn(userService, 'publishUserDataIfExists')
        .mockReturnValue(undefined);

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

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue('at');
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('idt');
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
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

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );

      const spy = vi
        .spyOn(authStateService, 'setAuthenticatedAndFireEvent')
        .mockReturnValue(undefined);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('if authenticated publishUserdataIfExists', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );

      const spy = vi
        .spyOn(userService, 'publishUserDataIfExists')
        .mockReturnValue(undefined);

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

      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      const spy = vi
        .spyOn(
          periodicallyTokenCheckService,
          'startTokenValidationPeriodically'
        )
        .mockReturnValue(undefined);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('if isCheckSessionConfigured call checkSessionService.start()', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(checkSessionService, 'isCheckSessionConfigured').mockReturnValue(
        true
      );
      const spy = vi
        .spyOn(checkSessionService, 'start')
        .mockReturnValue(undefined);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('if isSilentRenewConfigured call getOrCreateIframe()', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(silentRenewService, 'isSilentRenewConfigured').mockReturnValue(
        true
      );
      const spy = vi
        .spyOn(silentRenewService, 'getOrCreateIframe')
        .mockReturnValue(undefined as any);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalled();
      });
    }));

    it('calls checkSavedRedirectRouteAndNavigate if authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      const spy = vi
        .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
        .mockReturnValue(undefined);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(allConfigs[0]);
      });
    }));

    it('does not call checkSavedRedirectRouteAndNavigate if not authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      const spy = vi
        .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
        .mockReturnValue(undefined);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(0);
      });
    }));

    it('fires CheckingAuth-Event on start and finished event on end', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );

      const fireEventSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(vi.mocked(fireEventSpy).mock.calls).toEqual([
          [EventTypes.CheckingAuth],
          [EventTypes.CheckingAuthFinished],
        ]);
      });
    }));

    it('fires CheckingAuth-Event on start and CheckingAuthFinishedWithError event on end if exception occurs', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];
      const fireEventSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(true);
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        throwError(() => new Error('ERROR'))
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(vi.mocked(fireEventSpy).mock.calls).toEqual([
          [EventTypes.CheckingAuth],
          [EventTypes.CheckingAuthFinishedWithError, 'ERROR'],
        ]);
      });
    }));

    it('fires CheckingAuth-Event on start and finished event on end if not authenticated', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );

      const fireEventSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      checkAuthService.checkAuth(allConfigs[0], allConfigs).subscribe(() => {
        expect(vi.mocked(fireEventSpy).mock.calls).toEqual([
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

      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(refreshSessionService, 'forceRefreshSession').mockReturnValue(
        of({ isAuthenticated: true } as LoginResponse)
      );

      vi.spyOn(silentRenewService, 'isSilentRenewConfigured').mockReturnValue(
        true
      );
      const spy = vi
        .spyOn(silentRenewService, 'getOrCreateIframe')
        .mockReturnValue(undefined as any);

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

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );

      vi.spyOn(refreshSessionService, 'forceRefreshSession').mockReturnValue(
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

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(checkSessionService, 'isCheckSessionConfigured').mockReturnValue(
        true
      );
      vi.spyOn(silentRenewService, 'isSilentRenewConfigured').mockReturnValue(
        true
      );

      const checkSessionServiceStartSpy = vi
        .spyOn(checkSessionService, 'start')
        .mockReturnValue(undefined);
      const periodicallyTokenCheckServiceSpy = vi
        .spyOn(
          periodicallyTokenCheckService,
          'startTokenValidationPeriodically'
        )
        .mockReturnValue(undefined);
      const getOrCreateIframeSpy = vi
        .spyOn(silentRenewService, 'getOrCreateIframe')
        .mockReturnValue(undefined as any);

      vi.spyOn(refreshSessionService, 'forceRefreshSession').mockReturnValue(
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
          expect(checkSessionServiceStartSpy).toHaveBeenCalledTimes(1);
          expect(checkSessionServiceStartSpy).toHaveBeenCalledWith(
            allConfigs[0]
          );
          expect(periodicallyTokenCheckServiceSpy).toHaveBeenCalledTimes(1);
          expect(getOrCreateIframeSpy).toHaveBeenCalledTimes(1);
          expect(getOrCreateIframeSpy).toHaveBeenCalledWith(allConfigs[0]);
        });
    }));

    it('should start check session and validation after forceRefreshSession has been called and is authenticated after forcing without silentrenew', waitForAsync(() => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(checkSessionService, 'isCheckSessionConfigured').mockReturnValue(
        true
      );
      vi.spyOn(silentRenewService, 'isSilentRenewConfigured').mockReturnValue(
        false
      );

      const checkSessionServiceStartSpy = vi
        .spyOn(checkSessionService, 'start')
        .mockReturnValue(undefined);
      const periodicallyTokenCheckServiceSpy = vi
        .spyOn(
          periodicallyTokenCheckService,
          'startTokenValidationPeriodically'
        )
        .mockReturnValue(undefined);
      const getOrCreateIframeSpy = vi
        .spyOn(silentRenewService, 'getOrCreateIframe')
        .mockReturnValue(undefined as any);

      vi.spyOn(refreshSessionService, 'forceRefreshSession').mockReturnValue(
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
          expect(checkSessionServiceStartSpy).toHaveBeenCalledTimes(1);
          expect(checkSessionServiceStartSpy).toHaveBeenCalledWith(
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

      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue('the-state-param');
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authStateControl' && args[1] === allConfigs[0]) {
            return 'the-state-param';
          }

          return undefined;
        }
      );
      const spy = vi.spyOn(checkAuthService as any, 'checkAuthWithConfig');

      checkAuthService.checkAuthMultiple(allConfigs).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(vi.mocked(spy).mock.calls[0]).toEqual([
          allConfigs[0],
          allConfigs,
          undefined,
        ]);
        expect(vi.mocked(spy).mock.calls[1]).toEqual([
          allConfigs[1],
          allConfigs,
          undefined,
        ]);
      });
    }));

    it('uses config from passed configId if configId was passed and returns all results', waitForAsync(() => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue(null);

      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority1' },
        { configId: 'configId2', authority: 'some-authority2' },
      ];
      const spy = vi.spyOn(checkAuthService as any, 'checkAuthWithConfig');

      checkAuthService.checkAuthMultiple(allConfigs).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(vi.mocked(spy).mock.calls).toEqual([
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
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue(null);

      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority1' },
        { configId: 'configId2', authority: 'some-authority2' },
      ];
      const spy = vi.spyOn(checkAuthService as any, 'checkAuthWithConfig');

      checkAuthService.checkAuthMultiple(allConfigs).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(vi.mocked(spy).mock.calls[0]).toEqual([
          { configId: 'configId1', authority: 'some-authority1' },
          allConfigs,
          undefined,
        ]);
        expect(vi.mocked(spy).mock.calls[1]).toEqual([
          { configId: 'configId2', authority: 'some-authority2' },
          allConfigs,
          undefined,
        ]);
      });
    }));

    it('throws error if url has state param but no config could be found', waitForAsync(() => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue('the-state-param');

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
