import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { mockClass } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known/auth-well-known.service';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        FlowHelper,
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
        RefreshSessionService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        {
          provide: SilentRenewService,
          useClass: mockClass(SilentRenewService),
        },
        { provide: AuthStateService, useClass: mockClass(AuthStateService) },
        {
          provide: AuthWellKnownService,
          useClass: mockClass(AuthWellKnownService),
        },
        {
          provide: RefreshSessionIframeService,
          useClass: mockClass(RefreshSessionIframeService),
        },
        {
          provide: StoragePersistenceService,
          useClass: mockClass(StoragePersistenceService),
        },
        {
          provide: RefreshSessionRefreshTokenService,
          useClass: mockClass(RefreshSessionRefreshTokenService),
        },
        { provide: UserService, useClass: mockClass(UserService) },
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
          expect(result).toBeNull();
        });
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
          authResult: {
            id_token: 'some-id_token',
            access_token: 'some-access_token',
          },
        } as CallbackContext)
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

    it('calls start refresh session and waits for completed, returns null if auth is false', waitForAsync(() => {
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
      ).and.returnValue(of(null));
      const allConfigs = [
        {
          configId: 'configId1',
          silentRenewTimeoutInSeconds: 10,
        },
      ];

      refreshSessionService
        .forceRefreshSession(allConfigs[0], allConfigs)
        .subscribe((result) => {
          expect(result).toBeNull();
        });
    }));

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
      ).and.returnValue(of(null).pipe(delay(11000)));

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
      ).and.returnValue(of(null));
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
        ).and.returnValue(of(null));

        refreshSessionService
          .forceRefreshSession(allConfigs[0], allConfigs)
          .subscribe((result) => {
            expect(result).toBeNull();
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
            authResult: {
              id_token: 'some-id_token',
              access_token: 'some-access_token',
            },
          } as CallbackContext)
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
        .subscribe((result) => {
          expect(result).toBe(null);
        });
    }));

    it('returns null if silent renew Is running', waitForAsync(() => {
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

      (refreshSessionService as any)
        .startRefreshSession()
        .subscribe((result) => {
          expect(result).toBe(null);
        });
    }));

    it('calls `setSilentRenewRunning` when should be executed', waitForAsync(() => {
      const setSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'setSilentRenewRunning'
      );
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
      spyOn(
        refreshSessionRefreshTokenService,
        'refreshSessionWithRefreshTokens'
      ).and.returnValue(of(null));

      (refreshSessionService as any)
        .startRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(setSilentRenewRunningSpy).toHaveBeenCalled();
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
      ).and.returnValue(of(null));

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
      ).and.returnValue(of(null));

      const refreshSessionWithIframeSpy = spyOn(
        refreshSessionIframeService,
        'refreshSessionWithIframe'
      ).and.returnValue(of(null));

      (refreshSessionService as any)
        .startRefreshSession(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
          expect(refreshSessionWithIframeSpy).toHaveBeenCalled();
        });
    }));
  });
});
