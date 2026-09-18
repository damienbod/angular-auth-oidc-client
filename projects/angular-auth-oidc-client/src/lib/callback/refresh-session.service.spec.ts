import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs';
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
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      const writeSpy = spyOn(storagePersistenceService, 'write');
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
          expect(writeSpy).toHaveBeenCalledOnceWith(
            'storageCustomParamsRefresh',
            extraCustomParams,
            allConfigs[0]
          );
        });
    }));

    it('should persist storageCustomParamsAuthRequest when extra custom params given and useRefreshToken is false', waitForAsync(() => {
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      const allConfigs = [
        {
          configId: 'configId1',
          useRefreshToken: false,
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const writeSpy = spyOn(storagePersistenceService, 'write');
      const extraCustomParams = { extra: 'custom' };

      refreshSessionService
        .userForceRefreshSession(allConfigs[0], allConfigs, extraCustomParams)
        .subscribe(() => {
          expect(writeSpy).toHaveBeenCalledOnceWith(
            'storageCustomParamsAuthRequest',
            extraCustomParams,
            allConfigs[0]
          );
        });
    }));

    it('should NOT persist customparams if no customparams are given', waitForAsync(() => {
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      const allConfigs = [
        {
          configId: 'configId1',
          useRefreshToken: false,
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const writeSpy = spyOn(storagePersistenceService, 'write');

      refreshSessionService
        .userForceRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(writeSpy).not.toHaveBeenCalled();
        });
    }));

    it('should call resetSilentRenewRunning in case of an error', waitForAsync(() => {
      spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
        throwError(() => new Error('error'))
      );
      spyOn(flowsDataService, 'resetSilentRenewRunning');
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
            fail('It should not return any result.');
          },
          error: (error) => {
            expect(error).toBeInstanceOf(Error);
          },
        });

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledOnceWith(
        allConfigs[0]
      );
    }));

    it('should call resetSilentRenewRunning in case of no error', waitForAsync(() => {
      spyOn(refreshSessionService, 'forceRefreshSession').and.returnValue(
        of({} as LoginResponse)
      );
      spyOn(flowsDataService, 'resetSilentRenewRunning');
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
            fail('It should not return any error.');
          },
        });

      expect(flowsDataService.resetSilentRenewRunning).toHaveBeenCalledOnceWith(
        allConfigs[0]
      );
    }));
  });

  describe('forceRefreshSession', () => {
    it('only calls start refresh session and returns idToken and accessToken if auth is true', waitForAsync(() => {
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(authStateService, 'getIdToken').and.returnValue('id-token');
      spyOn(authStateService, 'getAccessToken').and.returnValue('access-token');
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
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
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

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionService as any,
        'waitForRunningRefreshSessionIfRequired'
      ).and.returnValue(of(false));
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(refreshResult));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(authStateService, 'getIdToken').and.returnValue('stale-id-token');
      spyOn(authStateService, 'getAccessToken').and.returnValue(
        'stale-access-token'
      );
      spyOn(userService, 'getUserDataFromStore').and.returnValue({
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

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionService as any,
        'waitForRunningRefreshSessionIfRequired'
      ).and.returnValue(of(false));
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(authStateService, 'getIdToken').and.returnValue('stored-id-token');
      spyOn(authStateService, 'getAccessToken').and.returnValue(
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

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
      spyOn(publicEventsService, 'registerForEvents').and.returnValue(events$);
      const startRefreshSessionSpy = spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      );

      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOn(authStateService, 'getIdToken').and.returnValue('updated-id-token');
      spyOn(authStateService, 'getAccessToken').and.returnValue(
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

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
      spyOn(publicEventsService, 'registerForEvents').and.returnValue(events$);

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

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
      spyOn(publicEventsService, 'registerForEvents').and.returnValue(events$);

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
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        true
      );
      spyOnProperty(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$'
      ).and.returnValue(
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
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOnProperty(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$'
      ).and.returnValue(of({ success: false, configId: 'configId1' }));
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

    it('should return the error message of the iframe completion if auth is false', async () => {
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOnProperty(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$'
      ).and.returnValue(
        of({
          success: false,
          configId: 'configId1',
          errorMessage: 'login_required',
        } as const)
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
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOnProperty(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$'
      ).and.returnValue(
        of({
          success: false,
          configId: 'configId1',
          errorMessage: 'login_required',
          errorDescription: 'session_expired',
        } as const)
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
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      spyOnProperty(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$'
      ).and.returnValue(
        of({ success: true, authResult: null, configId: 'configId1' } as const)
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

    it('occurs timeout error and retry mechanism exhausted max retry count throws error', fakeAsync(() => {
      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(of(null));
      spyOnProperty(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$'
      ).and.returnValue(
        of({ success: false, configId: 'configId1' } as const).pipe(
          delay(11000)
        )
      );

      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];
      const resetSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );
      const expectedInvokeCount = MAX_RETRY_ATTEMPTS;

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          next: () => {
            fail('It should not return any result.');
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

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      spyOnProperty(
        silentRenewService,
        'refreshSessionWithIFrameCompleted$'
      ).and.returnValue(of({ success: false, configId: 'configId1' }));
      spyOn(
        refreshSessionService as any,
        'startRefreshSession'
      ).and.returnValue(throwError(() => new Error(expectedErrorMessage)));
      spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
        false
      );

      const resetSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe({
          next: () => {
            fail('It should not return any result.');
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

        spyOn(
          flowHelper,
          'isCurrentFlowCodeFlowWithRefreshTokens'
        ).and.returnValue(false);
        spyOn(
          refreshSessionService as any,
          'startRefreshSession'
        ).and.returnValue(of(null));
        spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(
          false
        );
        spyOnProperty(
          silentRenewService,
          'refreshSessionWithIFrameCompleted$'
        ).and.returnValue(of({ success: false, configId: 'configId1' }));

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

        spyOn(
          flowHelper,
          'isCurrentFlowCodeFlowWithRefreshTokens'
        ).and.returnValue(false);
        spyOn(
          refreshSessionService as any,
          'startRefreshSession'
        ).and.returnValue(of(null));
        spyOnProperty(
          silentRenewService,
          'refreshSessionWithIFrameCompleted$'
        ).and.returnValue(
          of({
            success: true,
            authResult: {
              id_token: 'some-id_token',
              access_token: 'some-access_token',
            },
            configId: 'configId1',
          })
        );
        const spyInsideMap = spyOn(
          authStateService,
          'areAuthStorageTokensValid'
        ).and.returnValue(true);

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
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

      (refreshSessionService as any)
        .startRefreshSession()
        .subscribe((result: any) => {
          expect(result).toBe(null);
        });
    }));

    it('returns null if silent renew Is running', waitForAsync(() => {
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

      (refreshSessionService as any)
        .startRefreshSession()
        .subscribe((result: any) => {
          expect(result).toBe(null);
        });
    }));

    it('sets the running flag before async discovery so periodic renew cannot race', waitForAsync(() => {
      const callOrder: string[] = [];
      const setSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'setSilentRenewRunning'
      ).and.callFake(() => callOrder.push('set-running'));
      const fireEventSpy = spyOn(publicEventsService, 'fireEvent');
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];

      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      const queryAuthWellKnownSpy = spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.callFake(() => {
        callOrder.push('query-well-known');

        return of({});
      });

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).and.returnValue(of({} as CallbackContext));

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
      spyOn(flowsDataService, 'setSilentRenewRunning');
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];

      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(true);
      const refreshSessionWithRefreshTokensSpy = spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).and.returnValue(of({} as CallbackContext));

      (refreshSessionService as any)
        .startRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
        });
    }));

    it('calls refreshSessionWithIframe when current flow is NOT codeflow with refresh tokens', waitForAsync(() => {
      spyOn(flowsDataService, 'setSilentRenewRunning');
      const allConfigs = [
        {
          configId: 'configId1',
          authWellknownEndpointUrl: 'https://authWell',
        },
      ];

      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(
        flowHelper,
        'isCurrentFlowCodeFlowWithRefreshTokens'
      ).and.returnValue(false);
      const refreshSessionWithRefreshTokensSpy = spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).and.returnValue(of({} as CallbackContext));
      const refreshSessionWithIframeSpy = spyOn(
        refreshSessionIframeService,
        'refreshSessionWithIframe'
      ).and.returnValue(of(false));

      (refreshSessionService as any)
        .startRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
          expect(refreshSessionWithIframeSpy).toHaveBeenCalled();
        });
    }));
  });
});
