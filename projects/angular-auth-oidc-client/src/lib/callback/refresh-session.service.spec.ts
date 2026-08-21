import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { of, ReplaySubject, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known/auth-well-known.service';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
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
    it('should persist params refresh when extra custom params given and useRefreshToken is true', waitForAsync(() => {
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

      refreshSessionService
        .userForceRefreshSession(allConfigs[0], allConfigs, extraCustomParams)
        .subscribe(() => {
          expect(writeSpy).toHaveBeenCalledTimes(1);
          expect(writeSpy).toHaveBeenCalledWith(
            'storageCustomParamsRefresh',
            extraCustomParams,
            allConfigs[0]
          );
        });
    }));

    it('should persist storageCustomParamsAuthRequest when extra custom params given and useRefreshToken is false', waitForAsync(() => {
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

      refreshSessionService
        .userForceRefreshSession(allConfigs[0], allConfigs, extraCustomParams)
        .subscribe(() => {
          expect(writeSpy).toHaveBeenCalledTimes(1);
          expect(writeSpy).toHaveBeenCalledWith(
            'storageCustomParamsAuthRequest',
            extraCustomParams,
            allConfigs[0]
          );
        });
    }));

    it('should NOT persist customparams if no customparams are given', waitForAsync(() => {
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

      refreshSessionService
        .userForceRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(writeSpy).not.toHaveBeenCalled();
        });
    }));

    it('should call resetSilentRenewRunning in case of an error', waitForAsync(() => {
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

      refreshSessionService
        .userForceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          next: () => {
            throw new Error('It should not return any result.');
          },
          error: (error) => {
            expect(error).toBeInstanceOf(Error);
          },
        });

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledTimes(1);

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledWith(
        allConfigs[0]
      );
    }));

    it('should call resetSilentRenewRunning in case of no error', waitForAsync(() => {
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

      refreshSessionService
        .userForceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          error: () => {
            throw new Error('It should not return any error.');
          },
        });

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledTimes(1);

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledWith(
        allConfigs[0]
      );
    }));
  });

  describe('forceRefreshSession', () => {
    it('only calls start refresh session and returns idToken and accessToken if auth is true', waitForAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result.idToken).toEqual('id-token');
          expect(result.accessToken).toEqual('access-token');
        });
    }));

    it('only calls start refresh session and returns null if auth is false', waitForAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: false,
            errorMessage: '',
            userData: null,
            idToken: '',
            accessToken: '',
            configId: 'configId1',
          });
        });
    }));

    it('returns tokens from the completed refresh result when auth-state getters are stale', waitForAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            idToken: 'fresh-id-token',
            accessToken: 'fresh-access-token',
            userData: { sub: '123' },
            isAuthenticated: true,
            configId: 'configId1',
          });
        });
    }));

    it('falls back to auth-state getters when no refresh auth result is available', waitForAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result.idToken).toBe('stored-id-token');
          expect(result.accessToken).toBe('stored-access-token');
        });
    }));

    it('waits for a running periodic silent renew instead of starting a manual refresh', fakeAsync(() => {
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

      tick();
      expect(actualResult).toBeUndefined();
      expect(startRefreshSessionSpy).not.toHaveBeenCalled();

      events$.next({
        type: EventTypes.NewAuthenticationResult,
        value: {
          configId: 'configId1',
          isRenewProcess: true,
        },
      });
      tick();

      expect(actualResult).toEqual({
        idToken: 'updated-id-token',
        accessToken: 'updated-access-token',
        userData: undefined,
        isAuthenticated: true,
        configId: 'configId1',
      });
    }));

    it('propagates a failure from the running periodic silent renew', fakeAsync(() => {
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
      tick();

      expect(actualError).toBe(expectedError);
    }));

    it('times out while waiting for a running periodic silent renew', fakeAsync(() => {
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

      tick(1000);

      expect(actualError?.message).toBe(
        "Timed out waiting for the running refresh session for config 'configId1'"
      );
    }));

    it('calls start refresh session and waits for completed, returns idtoken and accesstoken if auth is true', waitForAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result.idToken).toBeDefined();
          expect(result.accessToken).toBeDefined();
        });
    }));

    it('calls start refresh session and waits for completed, returns LoginResponse if auth is false', waitForAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toEqual({
            isAuthenticated: false,
            errorMessage: '',
            userData: null,
            idToken: '',
            accessToken: '',
            configId: 'configId1',
          });
        });
    }));

    it('occurs timeout error and retry mechanism exhausted max retry count throws error', fakeAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          next: () => {
            throw new Error('It should not return any result.');
          },
          error: (error) => {
            expect(error).toBeInstanceOf(Error);
            expect(resetSilentRenewRunningSpy).toHaveBeenCalledTimes(
              expectedInvokeCount
            );
          },
        });

      tick(allConfigs[0].silentRenewTimeoutInSeconds * 10000);
    }));

    it('occurs unknown error throws it to subscriber', fakeAsync(() => {
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

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          next: () => {
            throw new Error('It should not return any result.');
          },
          error: (error) => {
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual(`Error: ${expectedErrorMessage}`);
            expect(resetSilentRenewRunningSpy).not.toHaveBeenCalled();
          },
        });
    }));

    describe('NOT isCurrentFlowCodeFlowWithRefreshTokens', () => {
      it('does return null when not authenticated', waitForAsync(() => {
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

        refreshSessionService
          .forceRefreshSession(allConfigs[0], allConfigs)
          .subscribe((result) => {
            expect(result).toEqual({
              isAuthenticated: false,
              errorMessage: '',
              userData: null,
              idToken: '',
              accessToken: '',
              configId: 'configId1',
            });
          });
      }));

      it('return value only returns once', waitForAsync(() => {
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

        refreshSessionService
          .forceRefreshSession(allConfigs[0], allConfigs)
          .subscribe((result) => {
            expect(result).toEqual({
              idToken: 'some-id_token',
              accessToken: 'some-access_token',
              isAuthenticated: true,
              userData: undefined,
              configId: 'configId1',
            });
            expect(spyInsideMap).toHaveBeenCalledTimes(1);
          });
      }));
    });
  });

  describe('startRefreshSession', () => {
    it('returns null if no auth well known endpoint defined', waitForAsync(() => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);

      (refreshSessionService as any)
        .startRefreshSession()
        .subscribe((result: any) => {
          expect(result).toBe(null);
        });
    }));

    it('returns null if silent renew Is running', waitForAsync(() => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);

      (refreshSessionService as any)
        .startRefreshSession()
        .subscribe((result: any) => {
          expect(result).toBe(null);
        });
    }));

    it('sets the running flag before async discovery so periodic renew cannot race', waitForAsync(() => {
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

      (refreshSessionService as any)
        .startRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(setSilentRenewRunningSpy).toHaveBeenCalled();
          expect(queryAuthWellKnownSpy).toHaveBeenCalled();
          expect(callOrder).toEqual(['set-running', 'query-well-known']);
          expect(fireEventSpy).toHaveBeenCalledWith(
            EventTypes.SilentRenewStarted
          );
        });
    }));

    it('calls refreshSessionWithRefreshTokens when current flow is codeflow with refresh tokens', waitForAsync(() => {
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

      (refreshSessionService as any)
        .startRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
        });
    }));

    it('calls refreshSessionWithIframe when current flow is NOT codeflow with refresh tokens', waitForAsync(() => {
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

      (refreshSessionService as any)
        .startRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
          expect(refreshSessionWithIframeSpy).toHaveBeenCalled();
        });
    }));
  });
});
