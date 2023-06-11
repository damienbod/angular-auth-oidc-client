import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { JwtKey, JwtKeys } from '../../validation/jwtkeys';
import { ValidationResult } from '../../validation/validation-result';
import { CallbackContext, AuthResult } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { SigninKeyDataService } from '../signin-key-data.service';
import { HistoryJwtKeysCallbackHandlerService } from './history-jwt-keys-callback-handler.service';

const DUMMY_JWT_KEYS: JwtKeys = {
  keys: [
    {
      kty: 'some-value1',
      use: 'some-value2',
      kid: 'some-value3',
      x5t: 'some-value4',
      e: 'some-value5',
      n: 'some-value6',
      x5c: ['some-value7'],
    },
  ],
};

describe('HistoryJwtKeysCallbackHandlerService', () => {
  let service: HistoryJwtKeysCallbackHandlerService;
  let storagePersistenceService: StoragePersistenceService;
  let signInKeyDataService: SigninKeyDataService;
  let resetAuthDataService: ResetAuthDataService;
  let flowsDataService: FlowsDataService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HistoryJwtKeysCallbackHandlerService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: AuthStateService, useClass: mockClass(AuthStateService) },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
        {
          provide: SigninKeyDataService,
          useClass: mockClass(SigninKeyDataService),
        },
        {
          provide: StoragePersistenceService,
          useClass: mockClass(StoragePersistenceService),
        },
        {
          provide: ResetAuthDataService,
          useClass: mockClass(ResetAuthDataService),
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(HistoryJwtKeysCallbackHandlerService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
    signInKeyDataService = TestBed.inject(SigninKeyDataService);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('callbackHistoryAndResetJwtKeys', () => {
    it('writes authResult into the storage', waitForAsync(() => {
      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'write'
      );
      const DUMMY_AUTH_RESULT = {
        refresh_token: 'dummy_refresh_token',
        id_token: 'some-id-token',
      };

      const callbackContext = {
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of({ keys: [] } as JwtKeys)
      );
      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe(() => {
          expect(storagePersistenceServiceSpy.calls.allArgs()).toEqual([
            ['authnResult', DUMMY_AUTH_RESULT, allconfigs[0]],
            ['jwtKeys', { keys: [] }, allconfigs[0]],
          ]);
          // write authnResult & jwtKeys
          expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(2);
        });
    }));

    it('writes refresh_token into the storage without reuse (refresh token rotation)', waitForAsync(() => {
      const DUMMY_AUTH_RESULT = {
        refresh_token: 'dummy_refresh_token',
        id_token: 'some-id-token',
      };

      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'write'
      );
      const callbackContext = {
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of({ keys: [] } as JwtKeys)
      );

      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe(() => {
          expect(storagePersistenceServiceSpy.calls.allArgs()).toEqual([
            ['authnResult', DUMMY_AUTH_RESULT, allconfigs[0]],
            ['jwtKeys', { keys: [] }, allconfigs[0]],
          ]);
          // write authnResult & refresh_token & jwtKeys
          expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(2);
        });
    }));

    it('writes refresh_token into the storage with reuse (without refresh token rotation)', waitForAsync(() => {
      const DUMMY_AUTH_RESULT = {
        refresh_token: 'dummy_refresh_token',
        id_token: 'some-id-token',
      };

      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'write'
      );
      const callbackContext = {
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
          allowUnsafeReuseRefreshToken: true,
        },
      ];

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of({ keys: [] } as JwtKeys)
      );
      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe(() => {
          expect(storagePersistenceServiceSpy.calls.allArgs()).toEqual([
            ['authnResult', DUMMY_AUTH_RESULT, allconfigs[0]],
            ['reusable_refresh_token', 'dummy_refresh_token', allconfigs[0]],
            ['jwtKeys', { keys: [] }, allconfigs[0]],
          ]);
          // write authnResult & refresh_token & jwtKeys
          expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(3);
        });
    }));

    it('resetBrowserHistory if historyCleanup is turned on and is not in a renewProcess', waitForAsync(() => {
      const DUMMY_AUTH_RESULT = {
        id_token: 'some-id-token',
      };
      const callbackContext = {
        isRenewProcess: false,
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: false,
        },
      ];

      const windowSpy = spyOn(window.history, 'replaceState');

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of({ keys: [] } as JwtKeys)
      );
      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe(() => {
          expect(windowSpy).toHaveBeenCalledTimes(1);
        });
    }));

    it('returns callbackContext with jwtkeys filled if everything works fine', waitForAsync(() => {
      const DUMMY_AUTH_RESULT = {
        id_token: 'some-id-token',
      };

      const callbackContext = {
        isRenewProcess: false,
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: false,
        },
      ];

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of({ keys: [{ kty: 'henlo' } as JwtKey] } as JwtKeys)
      );
      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe((result) => {
          expect(result).toEqual({
            isRenewProcess: false,
            authResult: DUMMY_AUTH_RESULT,
            jwtKeys: { keys: [{ kty: 'henlo' }] },
          } as CallbackContext);
        });
    }));

    it('returns error if no jwtKeys have been in the call --> keys are null', waitForAsync(() => {
      const DUMMY_AUTH_RESULT = {
        id_token: 'some-id-token',
      };

      const callbackContext = {
        isRenewProcess: false,
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: false,
        },
      ];

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(of(null));
      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          error: (err) => {
            expect(err.message).toEqual(
              `Failed to retrieve signing key with error: Error: Failed to retrieve signing key`
            );
          },
        });
    }));

    it('returns error if no jwtKeys have been in the call --> keys throw an error', waitForAsync(() => {
      const DUMMY_AUTH_RESULT = {
        id_token: 'some-id-token',
      };
      const callbackContext = {
        isRenewProcess: false,
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: false,
        },
      ];

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        throwError(() => new Error('error'))
      );
      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          error: (err) => {
            expect(err.message).toEqual(
              `Failed to retrieve signing key with error: Error: Error: error`
            );
          },
        });
    }));

    it('returns error if callbackContext.authresult has an error property filled', waitForAsync(() => {
      const callbackContext = {
        authResult: { error: 'someError' },
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];

      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          error: (err) => {
            expect(err.message).toEqual(
              `AuthCallback AuthResult came with error: someError`
            );
          },
        });
    }));

    it('calls resetAuthorizationData, resets nonce and authStateService in case of an error', waitForAsync(() => {
      const callbackContext = {
        authResult: { error: 'someError' },
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];

      const resetAuthorizationDataSpy = spyOn(
        resetAuthDataService,
        'resetAuthorizationData'
      );
      const setNonceSpy = spyOn(flowsDataService, 'setNonce');
      const updateAndPublishAuthStateSpy = spyOn(
        authStateService,
        'updateAndPublishAuthState'
      );

      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          error: () => {
            expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
            expect(setNonceSpy).toHaveBeenCalledTimes(1);
            expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.SecureTokenServerError,
              isRenewProcess: undefined,
            });
          },
        });
    }));

    it('calls authStateService.updateAndPublishAuthState with login required if the error is `login_required`', waitForAsync(() => {
      const callbackContext = {
        authResult: { error: 'login_required' },
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];

      const resetAuthorizationDataSpy = spyOn(
        resetAuthDataService,
        'resetAuthorizationData'
      );
      const setNonceSpy = spyOn(flowsDataService, 'setNonce');
      const updateAndPublishAuthStateSpy = spyOn(
        authStateService,
        'updateAndPublishAuthState'
      );

      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          error: () => {
            expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
            expect(setNonceSpy).toHaveBeenCalledTimes(1);
            expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.LoginRequired,
              isRenewProcess: undefined,
            });
          },
        });
    }));

    it('should store jwtKeys', waitForAsync(() => {
      const DUMMY_AUTH_RESULT = {
        id_token: 'some-id-token',
      };

      const initialCallbackContext = {
        authResult: DUMMY_AUTH_RESULT,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];
      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'write'
      );

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of(DUMMY_JWT_KEYS)
      );

      service
        .callbackHistoryAndResetJwtKeys(
          initialCallbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(2);
            expect(storagePersistenceServiceSpy.calls.allArgs()).toEqual([
              ['authnResult', DUMMY_AUTH_RESULT, allconfigs[0]],
              ['jwtKeys', DUMMY_JWT_KEYS, allconfigs[0]],
            ]);

            expect(callbackContext.jwtKeys).toEqual(DUMMY_JWT_KEYS);
          },
          error: (err) => {
            expect(err).toBeFalsy();
          },
        });
    }));

    it('should not store jwtKeys on error', waitForAsync(() => {
      const authResult = {
        id_token: 'some-id-token',
        access_token: 'some-access-token',
      } as AuthResult;
      const initialCallbackContext = {
        authResult,
      } as CallbackContext;

      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];
      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'write'
      );

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        throwError(() => new Error('Error'))
      );

      service
        .callbackHistoryAndResetJwtKeys(
          initialCallbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(callbackContext).toBeFalsy();
          },
          error: (err) => {
            expect(err).toBeTruthy();

            // storagePersistenceService.write() should not have been called with jwtKeys
            expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith(
              'authnResult',
              authResult,
              allconfigs[0]
            );
          },
        });
    }));

    it('should fallback to stored jwtKeys on error', waitForAsync(() => {
      const authResult = {
        id_token: 'some-id-token',
        access_token: 'some-access-token',
      } as AuthResult;
      const initialCallbackContext = {
        authResult,
      } as CallbackContext;

      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];
      const storagePersistenceServiceSpy = spyOn(
        storagePersistenceService,
        'read'
      );

      storagePersistenceServiceSpy.and.returnValue(DUMMY_JWT_KEYS);
      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        throwError(() => new Error('Error'))
      );

      service
        .callbackHistoryAndResetJwtKeys(
          initialCallbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith(
              'jwtKeys',
              allconfigs[0]
            );
            expect(callbackContext.jwtKeys).toEqual(DUMMY_JWT_KEYS);
          },
          error: (err) => {
            expect(err).toBeFalsy();
          },
        });
    }));

    it('should throw error if no jwtKeys are stored', waitForAsync(() => {
      const authResult = {
        id_token: 'some-id-token',
        access_token: 'some-access-token',
      } as AuthResult;

      const initialCallbackContext = { authResult } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
          historyCleanupOff: true,
        },
      ];

      spyOn(storagePersistenceService, 'read').and.returnValue(null);
      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        throwError(() => new Error('Error'))
      );

      service
        .callbackHistoryAndResetJwtKeys(
          initialCallbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(callbackContext).toBeFalsy();
          },
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
    }));
  });

  describe('historyCleanUpTurnedOn ', () => {
    it('check for false if historyCleanUpTurnedOn is on', () => {
      const config = {
        configId: 'configId1',
        historyCleanupOff: true,
      };

      const value = (service as any).historyCleanUpTurnedOn(config);

      expect(value).toEqual(false);
    });

    it('check for true if historyCleanUpTurnedOn is off', () => {
      const config = {
        configId: 'configId1',
        historyCleanupOff: false,
      };

      const value = (service as any).historyCleanUpTurnedOn(config);

      expect(value).toEqual(true);
    });
  });
});
