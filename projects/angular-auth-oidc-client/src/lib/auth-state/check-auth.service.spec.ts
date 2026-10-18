import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
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
import { LoggerService } from '../logging/services/logger.service';
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
  let loggerService: LoggerService;

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
    loggerService = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    storagePersistenceService.clear({} as OpenIdConfiguration);
  });

  it('should create', () => {
    expect(checkAuthService).toBeTruthy();
  });

  describe('checkAuth', () => {
    it('should error with a missing configuration message and not fire CheckingAuth when config is null', async () => {
      const fireEventSpy = vi.spyOn(publicEventsService, 'fireEvent');

      await expect(
        firstValueFrom(checkAuthService.checkAuth(null, []))
      ).rejects.toThrow(
        'Please provide a configuration before setting up the module'
      );
      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should use config with matching state when url has state param and config with state param is stored', async () => {
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
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      const isCallbackSpy = vi.spyOn(callBackService, 'isCallback');

      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(isCallbackSpy).toHaveBeenCalledTimes(1);
      expect(isCallbackSpy).toHaveBeenCalledWith(
        'http://localhost:4200',
        allConfigs[0]
      );
      expect(result.configId).toBe('configId1');
    });

    it('should throw error when url has state param and stored config with matching state param is not found', async () => {
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
      const isCallbackSpy = vi.spyOn(callBackService, 'isCallback');
      const getCurrentUrlSpy = vi.spyOn(currentUrlService, 'getCurrentUrl');

      await expect(
        firstValueFrom(checkAuthService.checkAuth(allConfigs[0], allConfigs))
      ).rejects.toThrow(
        'could not find matching config for state the-state-param'
      );
      expect(getCurrentUrlSpy).not.toHaveBeenCalled();
      expect(isCallbackSpy).not.toHaveBeenCalled();
    });

    it('should use first/default config when no param is passed', async () => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue(null);
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      const isCallbackSpy = vi.spyOn(callBackService, 'isCallback');
      const readSpy = vi.spyOn(storagePersistenceService, 'read');

      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(isCallbackSpy).toHaveBeenCalledTimes(1);
      expect(isCallbackSpy).toHaveBeenCalledWith('http://localhost:4200', {
        configId: 'configId1',
        authority: 'some-authority',
      });
      expect(readSpy).not.toHaveBeenCalledWith(
        'authStateControl',
        expect.anything()
      );
      expect(result.configId).toBe('configId1');
    });

    it('should return null and sendMessageToMainWindow if currently in a popup', async () => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(null);

      vi.spyOn(popUpService, 'isCurrentlyInPopup').mockReturnValue(true);
      const popupSpy = vi
        .spyOn(popUpService, 'sendMessageToMainWindow')
        .mockReturnValue(undefined);
      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

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

    it('should return isAuthenticated: false with error message in case handleCallbackAndFireEvents throws an error', async () => {
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

      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

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

    it('should call callbackService.handlePossibleStsCallback with current url when callback is true', async () => {
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
      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: true,
        userData: undefined,
        accessToken: 'at',
        configId: 'configId1',
        idToken: 'idt',
      });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        'http://localhost:4200',
        allConfigs[0],
        allConfigs
      );
    });

    it('should not call handleCallbackAndFireEvents with the current url when it is not a callback', async () => {
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

      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: true,
        userData: undefined,
        accessToken: 'at',
        configId: 'configId1',
        idToken: 'idt',
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should fire the auth and user data events when it is not a callback from the security token service and is authenticated', async () => {
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
      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

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

    it('should not fire the auth and user data events when it is not a callback from the security token service and is not authenticated', async () => {
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
      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

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

    it('should return true when authenticated', async () => {
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

      const result = await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: true,
        userData: undefined,
        accessToken: 'at',
        configId: 'configId1',
        idToken: 'idt',
      });
    });

    it('should set authorization data and fire an event when authenticated', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should publish user data if it exists when authenticated', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should start periodic token validation when authenticated', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should start the check session service when check session is configured', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should create the silent renew iframe when silent renew is configured', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should call checkSavedRedirectRouteAndNavigate if authenticated', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(allConfigs[0]);
    });

    it('should not call checkSavedRedirectRouteAndNavigate if not authenticated', async () => {
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
        false
      );
      const spy = vi
        .spyOn(autoLoginService, 'checkSavedRedirectRouteAndNavigate')
        .mockReturnValue(undefined);

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalledTimes(0);
    });

    it('should fire CheckingAuth-Event on start and finished event on end', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(vi.mocked(fireEventSpy).mock.calls).toEqual([
        [EventTypes.CheckingAuth],
        [EventTypes.CheckingAuthFinished],
      ]);
    });

    it('should fire CheckingAuth-Event on start and CheckingAuthFinishedWithError event on end if exception occurs', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(vi.mocked(fireEventSpy).mock.calls).toEqual([
        [EventTypes.CheckingAuth],
        [EventTypes.CheckingAuthFinishedWithError, 'ERROR'],
      ]);
    });

    it('should fire CheckingAuth-Event on start and finished event on end if not authenticated', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuth(allConfigs[0], allConfigs)
      );

      expect(vi.mocked(fireEventSpy).mock.calls).toEqual([
        [EventTypes.CheckingAuth],
        [EventTypes.CheckingAuthFinished],
      ]);
    });
  });

  describe('checkAuthIncludingServer', () => {
    it('should error with a missing configuration message and not force a refresh when config is null', async () => {
      const forceRefreshSessionSpy = vi.spyOn(
        refreshSessionService,
        'forceRefreshSession'
      );

      await expect(
        firstValueFrom(checkAuthService.checkAuthIncludingServer(null, []))
      ).rejects.toThrow(
        'Please provide a configuration before setting up the module'
      );
      expect(forceRefreshSessionSpy).not.toHaveBeenCalled();
    });

    it('should not start check session and validation when forceRefreshSession emits no response', async () => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(callBackService, 'isCallback').mockReturnValue(false);
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(checkSessionService, 'isCheckSessionConfigured').mockReturnValue(
        true
      );
      const checkSessionServiceStartSpy = vi
        .spyOn(checkSessionService, 'start')
        .mockReturnValue(undefined);
      const periodicallyTokenCheckServiceSpy = vi.spyOn(
        periodicallyTokenCheckService,
        'startTokenValidationPeriodically'
      );

      vi.spyOn(refreshSessionService, 'forceRefreshSession').mockReturnValue(
        of(null as unknown as LoginResponse)
      );

      const result = await firstValueFrom(
        checkAuthService.checkAuthIncludingServer(allConfigs[0], allConfigs)
      );

      expect(result).toBeNull();
      expect(checkSessionServiceStartSpy).not.toHaveBeenCalled();
      expect(periodicallyTokenCheckServiceSpy).not.toHaveBeenCalled();
    });

    it('should create the silent renew iframe when silent renew is configured', async () => {
      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority' },
      ];

      vi.spyOn(callBackService, 'handleCallbackAndFireEvents').mockReturnValue(
        of({} as CallbackContext)
      );
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      const forceRefreshSessionSpy = vi
        .spyOn(refreshSessionService, 'forceRefreshSession')
        .mockReturnValue(of({ isAuthenticated: true } as LoginResponse));

      vi.spyOn(silentRenewService, 'isSilentRenewConfigured').mockReturnValue(
        true
      );
      const spy = vi
        .spyOn(silentRenewService, 'getOrCreateIframe')
        .mockReturnValue(undefined as any);

      await firstValueFrom(
        checkAuthService.checkAuthIncludingServer(allConfigs[0], allConfigs)
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(allConfigs[0]);
      expect(forceRefreshSessionSpy).not.toHaveBeenCalled();
    });

    it('should call forceRefreshSession and not be authenticated', async () => {
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

      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      vi.spyOn(checkSessionService, 'isCheckSessionConfigured').mockReturnValue(
        true
      );
      const checkSessionServiceStartSpy = vi
        .spyOn(checkSessionService, 'start')
        .mockReturnValue(undefined);
      const forcedLoginResponse = {
        idToken: 'idToken',
        accessToken: 'access_token',
        isAuthenticated: false,
        userData: null,
        configId: 'configId1',
      };
      const forceRefreshSessionSpy = vi
        .spyOn(refreshSessionService, 'forceRefreshSession')
        .mockReturnValue(of(forcedLoginResponse));
      const result = await firstValueFrom(
        checkAuthService.checkAuthIncludingServer(allConfigs[0], allConfigs)
      );

      expect(forceRefreshSessionSpy).toHaveBeenCalledTimes(1);
      expect(forceRefreshSessionSpy).toHaveBeenCalledWith(
        allConfigs[0],
        allConfigs
      );
      expect(result).toEqual(forcedLoginResponse);
      expect(checkSessionServiceStartSpy).not.toHaveBeenCalled();
    });

    it('should start check session and validation after forceRefreshSession has been called and is authenticated after forcing with silentrenew', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuthIncludingServer(allConfigs[0], allConfigs)
      );

      expect(checkSessionServiceStartSpy).toHaveBeenCalledTimes(1);
      expect(checkSessionServiceStartSpy).toHaveBeenCalledWith(allConfigs[0]);
      expect(periodicallyTokenCheckServiceSpy).toHaveBeenCalledTimes(1);
      expect(getOrCreateIframeSpy).toHaveBeenCalledTimes(1);
      expect(getOrCreateIframeSpy).toHaveBeenCalledWith(allConfigs[0]);
    });

    it('should start check session and validation after forceRefreshSession has been called and is authenticated after forcing without silentrenew', async () => {
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

      await firstValueFrom(
        checkAuthService.checkAuthIncludingServer(allConfigs[0], allConfigs)
      );

      expect(checkSessionServiceStartSpy).toHaveBeenCalledTimes(1);
      expect(checkSessionServiceStartSpy).toHaveBeenCalledWith(allConfigs[0]);
      expect(periodicallyTokenCheckServiceSpy).toHaveBeenCalledTimes(1);
      expect(getOrCreateIframeSpy).not.toHaveBeenCalled();
    });
  });

  describe('checkAuthMultiple', () => {
    it('should use config with matching state when url has state param and config with state param is stored', async () => {
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
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      const isCallbackSpy = vi.spyOn(callBackService, 'isCallback');
      const result = await firstValueFrom(
        checkAuthService.checkAuthMultiple(allConfigs)
      );

      expect(result.map((x) => x.configId)).toEqual(['configId1', 'configId2']);
      expect(isCallbackSpy).toHaveBeenCalledTimes(2);
      expect(isCallbackSpy.mock.calls).toEqual([
        ['http://localhost:4200', allConfigs[0]],
        ['http://localhost:4200', allConfigs[1]],
      ]);
    });

    it('should check the config matching the url state first and all other configs with their redirectUrl and return all results', async () => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue('the-state-param');

      const allConfigs = [
        {
          configId: 'configId1',
          authority: 'some-authority1',
          redirectUrl: 'https://redirect-url-1',
        },
        { configId: 'configId2', authority: 'some-authority2' },
      ];

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authStateControl' && args[1] === allConfigs[1]) {
            return 'the-state-param';
          }

          return undefined;
        }
      );
      const isCallbackSpy = vi.spyOn(callBackService, 'isCallback');
      const result = await firstValueFrom(
        checkAuthService.checkAuthMultiple(allConfigs, 'https://current-url')
      );

      expect(result.map((x) => x.configId)).toEqual(['configId2', 'configId1']);
      expect(isCallbackSpy.mock.calls).toEqual([
        ['https://current-url', allConfigs[1]],
        ['https://redirect-url-1', allConfigs[0]],
      ]);
    });

    it('should run through all configs if no parameter is passed and has no state in url', async () => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue(null);

      const allConfigs = [
        { configId: 'configId1', authority: 'some-authority1' },
        { configId: 'configId2', authority: 'some-authority2' },
      ];
      vi.spyOn(currentUrlService, 'getCurrentUrl').mockReturnValue(
        'http://localhost:4200'
      );
      const isCallbackSpy = vi.spyOn(callBackService, 'isCallback');
      const result = await firstValueFrom(
        checkAuthService.checkAuthMultiple(allConfigs)
      );

      expect(result.map((x) => x.configId)).toEqual(['configId1', 'configId2']);
      expect(isCallbackSpy).toHaveBeenCalledTimes(2);
      expect(isCallbackSpy.mock.calls).toEqual([
        [
          'http://localhost:4200',
          { configId: 'configId1', authority: 'some-authority1' },
        ],
        [
          'http://localhost:4200',
          { configId: 'configId2', authority: 'some-authority2' },
        ],
      ]);
    });

    it('should return an unauthenticated result and log an error for a missing config when no state is in url', async () => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue(null);
      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      const allConfigs = [null as unknown as OpenIdConfiguration];
      const result = await firstValueFrom(
        checkAuthService.checkAuthMultiple(allConfigs)
      );

      expect(result).toEqual([
        {
          isAuthenticated: false,
          errorMessage:
            'Please provide at least one configuration before setting up the module',
          userData: null,
          idToken: '',
          accessToken: '',
          configId: '',
        },
      ]);
      expect(logErrorSpy).toHaveBeenCalledWith(
        null,
        'Please provide at least one configuration before setting up the module'
      );
    });

    it('should throw error if url has state param but no config could be found', async () => {
      vi.spyOn(
        currentUrlService,
        'getStateParamFromCurrentUrl'
      ).mockReturnValue('the-state-param');

      const allConfigs: OpenIdConfiguration[] = [];

      await expect(
        firstValueFrom(checkAuthService.checkAuthMultiple(allConfigs))
      ).rejects.toThrow(
        'could not find matching config for state the-state-param'
      );
    });
  });
});
