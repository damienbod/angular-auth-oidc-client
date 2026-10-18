import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  firstValueFrom,
  NEVER,
  of,
  ReplaySubject,
  throwError,
  TimeoutError,
} from 'rxjs';
import { delay } from 'rxjs/operators';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known/auth-well-known.service';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/services/logger.service';
import { LoginResponse } from '../login/login-response';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../user-data/user.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';
import {
  MAX_RETRY_ATTEMPTS,
  RefreshSessionService,
} from './refresh-session.service';

describe('RefreshSessionService ', () => {
  beforeEach(() => {
    vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  let refreshSessionService: RefreshSessionService;
  let flowHelper: FlowHelper;
  let authStateService: AuthStateService;
  let silentRenewService: SilentRenewService;
  let storagePersistenceService: StoragePersistenceService;
  let flowsDataService: FlowsDataService;
  let refreshSessionIframeService: RefreshSessionIframeService;
  let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
  let authWellKnownService: AuthWellKnownService;
  let publicEventsService: PublicEventsService;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        FlowHelper,
        mockProvider(FlowsDataService),
        RefreshSessionService,
        mockProvider(LoggerService),
        mockProvider(SilentRenewService),
        mockProvider(AuthStateService),
        mockProvider(AuthWellKnownService),
        mockProvider(RefreshSessionIframeService),
        mockProvider(StoragePersistenceService),
        mockProvider(RefreshSessionRefreshTokenService),
        mockProvider(UserService),
        mockProvider(PublicEventsService),
      ],
    });
  });

  beforeEach(() => {
    refreshSessionService = TestBed.inject(RefreshSessionService);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowHelper = TestBed.inject(FlowHelper);
    authStateService = TestBed.inject(AuthStateService);
    refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);
    refreshSessionRefreshTokenService = TestBed.inject(
      RefreshSessionRefreshTokenService
    );
    silentRenewService = TestBed.inject(SilentRenewService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    publicEventsService = TestBed.inject(PublicEventsService);
    userService = TestBed.inject(UserService);
  });

  it('should create', () => {
    expect(refreshSessionService).toBeTruthy();
  });

  describe('userForceRefreshSession', () => {
    it('should persist params refresh when extra custom params given and useRefreshToken is true', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      const writeSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const allConfigs = [
        {
          configId: 'configId1',
          useRefreshToken: true,
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const extraCustomParams = { extra: 'custom' };

      await firstValueFrom(
        refreshSessionService.userForceRefreshSession(
          allConfigs[0],
          allConfigs,
          extraCustomParams
        )
      );

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(
        'storageCustomParamsRefresh',
        extraCustomParams,
        allConfigs[0]
      );
    });

    it('should persist storageCustomParamsAuthRequest when extra custom params given and useRefreshToken is false', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      const allConfigs = [
        {
          configId: 'configId1',
          useRefreshToken: false,
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const writeSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
      const extraCustomParams = { extra: 'custom' };

      await firstValueFrom(
        refreshSessionService.userForceRefreshSession(
          allConfigs[0],
          allConfigs,
          extraCustomParams
        )
      );

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(
        'storageCustomParamsAuthRequest',
        extraCustomParams,
        allConfigs[0]
      );
    });

    it('should NOT persist customparams if no customparams are given', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      const allConfigs = [
        {
          configId: 'configId1',
          useRefreshToken: false,
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const writeSpy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);

      await firstValueFrom(
        refreshSessionService.userForceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(writeSpy).not.toHaveBeenCalled();
    });

    it('should call resetSilentRenewRunning in case of an error', async () => {
      vi.spyOn(refreshSessionService, 'forceRefreshSession').mockReturnValue(
        throwError(() => new Error('error'))
      );
      vi.spyOn(flowsDataService, 'resetSilentRenewRunning').mockReturnValue(
        undefined
      );
      const allConfigs = [
        {
          configId: 'configId1',
          useRefreshToken: false,
          silentRenewTimeoutInSeconds: 10,
        },
      ];

      await expect(
        firstValueFrom(
          refreshSessionService.userForceRefreshSession(
            allConfigs[0],
            allConfigs
          )
        )
      ).rejects.toBeInstanceOf(Error);

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledTimes(1);

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledWith(
        allConfigs[0]
      );
    });

    it('should call resetSilentRenewRunning in case of no error', async () => {
      vi.spyOn(refreshSessionService, 'forceRefreshSession').mockReturnValue(
        of({} as LoginResponse)
      );
      vi.spyOn(flowsDataService, 'resetSilentRenewRunning').mockReturnValue(
        undefined
      );
      const allConfigs = [
        {
          configId: 'configId1',
          useRefreshToken: false,
          silentRenewTimeoutInSeconds: 10,
        },
      ];

      await firstValueFrom(
        refreshSessionService.userForceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledTimes(1);

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledWith(
        allConfigs[0]
      );
    });

    it('throws an error and does not start a refresh when no config is given', async () => {
      // Arrange
      const forceRefreshSessionSpy = vi.spyOn(
        refreshSessionService,
        'forceRefreshSession'
      );
      const writeSpy = vi.spyOn(storagePersistenceService, 'write');
      const resetSilentRenewRunningSpy = vi.spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );
      // Act
      const result = firstValueFrom(
        refreshSessionService.userForceRefreshSession(null, [], {
          extra: 'custom',
        })
      );

      // Assert
      await expect(result).rejects.toThrow(
        'Please provide a configuration before setting up the module'
      );
      expect(forceRefreshSessionSpy).not.toHaveBeenCalled();
      expect(writeSpy).not.toHaveBeenCalled();
      expect(resetSilentRenewRunningSpy).not.toHaveBeenCalled();
    });
  });

  describe('forceRefreshSession', () => {
    it('limits the duration of the complete refresh token flow', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'waitForRunningRefreshSessionIfRequired'
      ).mockReturnValue(of(false));
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(NEVER);
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 0.01,
        },
      ];
      const result = firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      await vi.advanceTimersByTimeAsync(10);

      await expect(result).rejects.toBeInstanceOf(TimeoutError);
    });

    it('uses the default timeout for the complete refresh token flow', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'waitForRunningRefreshSessionIfRequired'
      ).mockReturnValue(of(false));
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(NEVER);
      const allConfigs = [{ configId: 'configId1' }];
      let settled = false;
      const result = firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      ).finally(() => (settled = true));

      result.catch(() => undefined);

      await vi.advanceTimersByTimeAsync(19_900);
      expect(settled).toBe(false);

      await vi.advanceTimersByTimeAsync(100);

      await expect(result).rejects.toBeInstanceOf(TimeoutError);
    });

    it('only calls start refresh session and returns idToken and accessToken if auth is true', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('id-token');
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'access-token'
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result.idToken).toEqual('id-token');
      expect(result.accessToken).toEqual('access-token');
    });

    it('only calls start refresh session and returns null if auth is false', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: false,
        errorMessage: '',
        userData: null,
        idToken: '',
        accessToken: '',
        configId: 'configId1',
      });
    });

    it('returns tokens from the completed refresh result when auth-state getters are stale', async () => {
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const refreshResult = {
        authResult: {
          id_token: 'fresh-id-token',
          access_token: 'fresh-access-token',
        },
      } as CallbackContext;

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'waitForRunningRefreshSessionIfRequired'
      ).mockReturnValue(of(false));
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(refreshResult));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue(
        'stale-id-token'
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'stale-access-token'
      );
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue({
        sub: '123',
      } as any);

      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        idToken: 'fresh-id-token',
        accessToken: 'fresh-access-token',
        userData: { sub: '123' },
        isAuthenticated: true,
        configId: 'configId1',
      });
    });

    it('falls back to auth-state getters when no refresh auth result is available', async () => {
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionService as any,
        'waitForRunningRefreshSessionIfRequired'
      ).mockReturnValue(of(false));
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue(
        'stored-id-token'
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'stored-access-token'
      );

      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result.idToken).toBe('stored-id-token');
      expect(result.accessToken).toBe('stored-access-token');
    });

    it('waits for a running periodic silent renew instead of starting a manual refresh', async () => {
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const events$ = new ReplaySubject<any>(1);
      let actualResult: LoginResponse | undefined;

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(publicEventsService, 'registerForEvents').mockReturnValue(
        events$
      );
      const startRefreshSessionSpy = vi
        .spyOn(refreshSessionService as any, 'startRefreshSession')
        .mockReturnValue(undefined);

      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue(
        'updated-id-token'
      );
      vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
        'updated-access-token'
      );

      events$.next({
        type: EventTypes.SilentRenewStarted,
      });

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          actualResult = result;
        });

      await vi.advanceTimersByTimeAsync(0);
      expect(actualResult).toBeUndefined();
      expect(startRefreshSessionSpy).not.toHaveBeenCalled();

      events$.next({
        type: EventTypes.NewAuthenticationResult,
        value: {
          configId: 'configId1',
          isRenewProcess: true,
        },
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(actualResult).toEqual({
        idToken: 'updated-id-token',
        accessToken: 'updated-access-token',
        userData: undefined,
        isAuthenticated: true,
        configId: 'configId1',
      });
    });

    it('refreshes through the refresh token lock instead of waiting for a silent renew that may run in another tab', async () => {
      // Arrange
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionRefreshTokenService,
        'usesRefreshTokenLock'
      ).mockReturnValue(true);
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));
      const registerForEventsSpy = vi.spyOn(
        publicEventsService,
        'registerForEvents'
      );
      const refreshSessionWithRefreshTokensSpy = vi
        .spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        )
        .mockReturnValue(
          of({
            authResult: {
              id_token: 'refreshed-id-token',
              access_token: 'refreshed-access-token',
            },
          } as CallbackContext)
        );

      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );

      // Act
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      // Assert
      expect(registerForEventsSpy).not.toHaveBeenCalled();
      expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        idToken: 'refreshed-id-token',
        accessToken: 'refreshed-access-token',
        userData: undefined,
        isAuthenticated: true,
        configId: 'configId1',
      });
    });

    it('propagates a failure from the running periodic silent renew', async () => {
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const events$ = new ReplaySubject<any>(1);
      const expectedError = new Error('periodic refresh failed');
      let actualError: Error | undefined;

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(publicEventsService, 'registerForEvents').mockReturnValue(
        events$
      );

      events$.next({
        type: EventTypes.SilentRenewStarted,
      });

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          error: (error) => {
            actualError = error;
          },
        });

      events$.next({
        type: EventTypes.SilentRenewFailed,
        value: expectedError,
      });
      await vi.advanceTimersByTimeAsync(0);

      expect(actualError).toBe(expectedError);
    });

    it('times out while waiting for a running periodic silent renew', async () => {
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 1,
        },
      ];
      const events$ = new ReplaySubject<any>(1);
      let actualError: Error | undefined;

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(publicEventsService, 'registerForEvents').mockReturnValue(
        events$
      );

      events$.next({
        type: EventTypes.SilentRenewStarted,
      });

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          error: (error) => {
            actualError = error;
          },
        });

      await vi.advanceTimersByTimeAsync(1000);

      expect(actualError?.message).toBe(
        "Timed out waiting for the running refresh session for config 'configId1'"
      );
    });

    it('calls start refresh session and waits for completed, returns idtoken and accesstoken if auth is true', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(
        of({
          success: true,
          authResult: {
            id_token: 'some-id_token',
            access_token: 'some-access_token',
          },
          configId: 'configId1',
        })
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result.idToken).toBe('some-id_token');
      expect(result.accessToken).toBe('some-access_token');
    });

    it('calls start refresh session and waits for completed, returns LoginResponse if auth is false', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(of({ success: false, configId: 'configId1' }));
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: false,
        errorMessage: '',
        userData: null,
        idToken: '',
        accessToken: '',
        configId: 'configId1',
      });
    });

    it('should return the error message of the iframe completion if auth is false', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(
        of({
          success: false,
          configId: 'configId1',
          errorMessage: 'login_required',
        })
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: false,
        errorMessage: 'login_required',
        userData: null,
        idToken: '',
        accessToken: '',
        configId: 'configId1',
      });
    });

    it('should return the error description of the iframe completion if auth is false', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(
        of({
          success: false,
          configId: 'configId1',
          errorMessage: 'login_required',
          errorDescription: 'session_expired',
        })
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: false,
        errorMessage: 'login_required',
        errorDescription: 'session_expired',
        userData: null,
        idToken: '',
        accessToken: '',
        configId: 'configId1',
      });
    });

    it('should return an empty error message if the iframe completed successfully but auth is false', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(
        of({ success: true, authResult: null, configId: 'configId1' })
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      expect(result).toEqual({
        isAuthenticated: false,
        errorMessage: '',
        userData: null,
        idToken: '',
        accessToken: '',
        configId: 'configId1',
      });
    });

    it('occurs timeout error and retry mechanism exhausted max retry count throws error', async () => {
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(
        of({ success: false, configId: 'configId1' } as const).pipe(
          delay(11000)
        )
      );

      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const expectedInvokeCount = MAX_RETRY_ATTEMPTS;
      const nextSpy = vi.fn();
      let actualError: unknown;

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          next: nextSpy,
          error: (error) => {
            actualError = error;
          },
        });

      // 4 attempts timing out after 10s each, plus retry delays of 1s, 2s and 3s => 46s
      await vi.advanceTimersByTimeAsync(45_900);
      expect(actualError).toBeUndefined();

      await vi.advanceTimersByTimeAsync(1_000);

      expect(actualError).toBeInstanceOf(Error);
      expect(nextSpy).not.toHaveBeenCalled();
      expect(resetSilentRenewRunningSpy).toHaveBeenCalledTimes(
        expectedInvokeCount
      );
    });

    it('occurs unknown error throws it to subscriber', async () => {
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const expectedErrorMessage = 'Test error message';

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(of({ success: false, configId: 'configId1' }));
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(throwError(() => new Error(expectedErrorMessage)));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        false
      );

      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);

      await expect(
        firstValueFrom(
          refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
        )
      ).rejects.toThrow(`Error: ${expectedErrorMessage}`);
      expect(resetSilentRenewRunningSpy).not.toHaveBeenCalled();
    });

    it('returns empty tokens if auth is true but the iframe completion was not successful', async () => {
      // Arrange
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(userService, 'getUserDataFromStore').mockReturnValue({
        sub: 'user',
      });
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(
        of({
          success: false,
          configId: 'configId1',
          errorMessage: 'login_required',
        })
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      // Act
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      // Assert
      expect(result).toEqual({
        idToken: '',
        accessToken: '',
        userData: { sub: 'user' },
        isAuthenticated: true,
        configId: 'configId1',
      });
    });

    it('returns empty tokens if auth is true and the successful iframe completion carries no tokens', async () => {
      // Arrange
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
        true
      );
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(
        of({ success: true, authResult: {}, configId: 'configId1' } as any)
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      // Act
      const result = await firstValueFrom(
        refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
      );

      // Assert
      expect(result.idToken).toBe('');
      expect(result.accessToken).toBe('');
      expect(result.isAuthenticated).toBe(true);
    });

    it('times out the iframe refresh immediately and fails after the retries when no silent renew timeout is configured', async () => {
      // Arrange
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      vi.spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).mockReturnValue(of(null));
      vi.spyOn(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$',
        'get'
      ).mockReturnValue(NEVER);
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const allConfigs = [{ configId: 'configId1' }];
      let actualError: unknown;

      // Act
      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          error: (error) => {
            actualError = error;
          },
        });

      // Assert
      // 4 attempts timing out after 0s each, plus retry delays of 1s, 2s and 3s => 6s
      await vi.advanceTimersByTimeAsync(5_900);
      expect(actualError).toBeUndefined();

      await vi.advanceTimersByTimeAsync(200);

      expect(actualError).toBeInstanceOf(Error);
      expect(resetSilentRenewRunningSpy).toHaveBeenCalledTimes(
        MAX_RETRY_ATTEMPTS
      );
    });

    describe('NOT isCurrentFlowCodeFlowWithRefreshTokens', () => {
      it('does return null when not authenticated', async () => {
        const allConfigs = [
          {
            configId: 'configId1',
            silentRenewTimeoutInSeconds: 10,
          },
        ];

        vi.spyOn(
          flowHelper,
          'isCurrentFlowCodeFlowWithRefreshTokens'
        ).mockReturnValue(false);
        vi.spyOn(
          refreshSessionService as any,
          'startRefreshSession'
        ).mockReturnValue(of(null));
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        vi.spyOn(
          silentRenewService,
          'refreshSessionWithIFrameCompleted$',
          'get'
        ).mockReturnValue(of({ success: false, configId: 'configId1' }));

        const result = await firstValueFrom(
          refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
        );

        expect(result).toEqual({
          isAuthenticated: false,
          errorMessage: '',
          userData: null,
          idToken: '',
          accessToken: '',
          configId: 'configId1',
        });
      });

      it('return value only returns once', async () => {
        const allConfigs = [
          {
            configId: 'configId1',
            silentRenewTimeoutInSeconds: 10,
          },
        ];

        vi.spyOn(
          flowHelper,
          'isCurrentFlowCodeFlowWithRefreshTokens'
        ).mockReturnValue(false);
        vi.spyOn(
          refreshSessionService as any,
          'startRefreshSession'
        ).mockReturnValue(of(null));
        vi.spyOn(
          silentRenewService,
          'refreshSessionWithIFrameCompleted$',
          'get'
        ).mockReturnValue(
          of({
            success: true,
            authResult: {
              id_token: 'some-id_token',
              access_token: 'some-access_token',
            },
            configId: 'configId1',
          })
        );
        const spyInsideMap = vi
          .spyOn(authStateService, 'areAuthStorageTokensValid')
          .mockReturnValue(true);
        const result = await firstValueFrom(
          refreshSessionService.forceRefreshSession(allConfigs[0], allConfigs)
        );

        expect(result).toEqual({
          idToken: 'some-id_token',
          accessToken: 'some-access_token',
          isAuthenticated: true,
          userData: undefined,
          configId: 'configId1',
        });
        expect(spyInsideMap).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('waitForRunningRefreshSessionIfRequired', () => {
    it('uses a default timeout of 20 seconds when no silent renew timeout is configured', async () => {
      // Arrange
      const config = { configId: 'configId1' };
      const events$ = new ReplaySubject<any>(1);
      let actualError: Error | undefined;

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(publicEventsService, 'registerForEvents').mockReturnValue(
        events$
      );

      // Act
      (refreshSessionService as any)
        .waitForRunningRefreshSessionIfRequired(config)
        .subscribe({
          error: (error: Error) => {
            actualError = error;
          },
        });

      // Assert
      await vi.advanceTimersByTimeAsync(19_900);
      expect(actualError).toBeUndefined();

      await vi.advanceTimersByTimeAsync(100);

      expect(actualError?.message).toBe(
        "Timed out waiting for the running refresh session for config 'configId1'"
      );
    });

    it('reports an empty config id in the timeout error when the config has no config id', async () => {
      // Arrange
      const config = { silentRenewTimeoutInSeconds: 1 };
      const events$ = new ReplaySubject<any>(1);
      let actualError: Error | undefined;

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(publicEventsService, 'registerForEvents').mockReturnValue(
        events$
      );

      // Act
      (refreshSessionService as any)
        .waitForRunningRefreshSessionIfRequired(config)
        .subscribe({
          error: (error: Error) => {
            actualError = error;
          },
        });
      await vi.advanceTimersByTimeAsync(1000);

      // Assert
      expect(actualError?.message).toBe(
        "Timed out waiting for the running refresh session for config ''"
      );
    });

    it('wraps a non-error silent renew failure value into an error', async () => {
      // Arrange
      const config = { configId: 'configId1', silentRenewTimeoutInSeconds: 10 };
      const events$ = new ReplaySubject<any>(1);
      let actualError: unknown;

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(publicEventsService, 'registerForEvents').mockReturnValue(
        events$
      );
      events$.next({
        type: EventTypes.SilentRenewFailed,
        value: 'iframe renew failed',
      });

      // Act
      (refreshSessionService as any)
        .waitForRunningRefreshSessionIfRequired(config)
        .subscribe({
          error: (error: unknown) => {
            actualError = error;
          },
        });
      await vi.advanceTimersByTimeAsync(0);

      // Assert
      expect(actualError).toBeInstanceOf(Error);
      expect((actualError as Error).message).toBe('iframe renew failed');
    });

    it('fails with a default message when the silent renew failure carries no value', async () => {
      // Arrange
      const config = { configId: 'configId1', silentRenewTimeoutInSeconds: 10 };
      const events$ = new ReplaySubject<any>(1);
      let actualError: unknown;

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      vi.spyOn(publicEventsService, 'registerForEvents').mockReturnValue(
        events$
      );
      events$.next({ type: EventTypes.SilentRenewFailed });

      // Act
      (refreshSessionService as any)
        .waitForRunningRefreshSessionIfRequired(config)
        .subscribe({
          error: (error: unknown) => {
            actualError = error;
          },
        });
      await vi.advanceTimersByTimeAsync(0);

      // Assert
      expect(actualError).toBeInstanceOf(Error);
      expect((actualError as Error).message).toBe('Silent renew failed');
    });
  });

  describe('startRefreshSession', () => {
    it('returns null if silent renew Is running', async () => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);

      const result = await firstValueFrom(
        (refreshSessionService as any).startRefreshSession()
      );

      expect(result).toBe(null);
    });

    it('sets the running flag before async discovery so periodic renew cannot race', async () => {
      const callOrder: string[] = [];
      const setSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'setSilentRenewRunning')
        .mockImplementation(() => callOrder.push('set-running'));
      const fireEventSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      const queryAuthWellKnownSpy = vi
        .spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints')
        .mockImplementation(() => {
          callOrder.push('query-well-known');

          return of({});
        });

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).mockReturnValue(of({} as CallbackContext));

      await firstValueFrom(
        (refreshSessionService as any).startRefreshSession(
          allConfigs[0],
          allConfigs
        )
      );

      expect(setSilentRenewRunningSpy).toHaveBeenCalled();
      expect(queryAuthWellKnownSpy).toHaveBeenCalled();
      expect(callOrder).toEqual(['set-running', 'query-well-known']);
      expect(fireEventSpy).toHaveBeenCalledWith(EventTypes.SilentRenewStarted);
    });

    it('calls refreshSessionWithRefreshTokens when current flow is codeflow with refresh tokens', async () => {
      vi.spyOn(flowsDataService, 'setSilentRenewRunning').mockReturnValue(
        undefined
      );
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      const refreshSessionWithRefreshTokensSpy = vi
        .spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        )
        .mockReturnValue(of({} as CallbackContext));

      await firstValueFrom(
        (refreshSessionService as any).startRefreshSession(
          allConfigs[0],
          allConfigs
        )
      );

      expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
    });

    it('calls refreshSessionWithIframe when current flow is NOT codeflow with refresh tokens', async () => {
      vi.spyOn(flowsDataService, 'setSilentRenewRunning').mockReturnValue(
        undefined
      );
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(false);
      const refreshSessionWithRefreshTokensSpy = vi
        .spyOn(
          refreshSessionRefreshTokenService,
          'refreshSessionWithRefreshTokens'
        )
        .mockReturnValue(of({} as CallbackContext));
      const refreshSessionWithIframeSpy = vi
        .spyOn(refreshSessionIframeService, 'refreshSessionWithIframe')
        .mockReturnValue(of(false));

      await firstValueFrom(
        (refreshSessionService as any).startRefreshSession(
          allConfigs[0],
          allConfigs
        )
      );

      expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
      expect(refreshSessionWithIframeSpy).toHaveBeenCalled();
    });

    it('fires SilentRenewFailed, resets the running flag and rethrows when the refresh fails', async () => {
      // Arrange
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];
      const expectedError = new Error('refresh failed');

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(flowsDataService, 'setSilentRenewRunning').mockReturnValue(
        undefined
      );
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const fireEventSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));
      vi.spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).mockReturnValue(true);
      vi.spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).mockReturnValue(throwError(() => expectedError));

      // Act
      const result = firstValueFrom(
        (refreshSessionService as any).startRefreshSession(
          allConfigs[0],
          allConfigs
        )
      );

      // Assert
      await expect(result).rejects.toBe(expectedError);
      expect(fireEventSpy).toHaveBeenCalledWith(
        EventTypes.SilentRenewFailed,
        expectedError
      );
      expect(resetSilentRenewRunningSpy).toHaveBeenCalledExactlyOnceWith(
        allConfigs[0]
      );
    });

    it('fires SilentRenewFailed, resets the running flag and rethrows when the well-known discovery fails', async () => {
      // Arrange
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];
      const expectedError = new Error('discovery failed');

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(flowsDataService, 'setSilentRenewRunning').mockReturnValue(
        undefined
      );
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const fireEventSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(throwError(() => expectedError));
      const refreshSessionWithIframeSpy = vi.spyOn(
        refreshSessionIframeService,
        'refreshSessionWithIframe'
      );
      // Act
      const result = firstValueFrom(
        (refreshSessionService as any).startRefreshSession(
          allConfigs[0],
          allConfigs
        )
      );

      // Assert
      await expect(result).rejects.toBe(expectedError);
      expect(refreshSessionWithIframeSpy).not.toHaveBeenCalled();
      expect(fireEventSpy).toHaveBeenCalledWith(
        EventTypes.SilentRenewFailed,
        expectedError
      );
      expect(resetSilentRenewRunningSpy).toHaveBeenCalledExactlyOnceWith(
        allConfigs[0]
      );
    });
  });
});
