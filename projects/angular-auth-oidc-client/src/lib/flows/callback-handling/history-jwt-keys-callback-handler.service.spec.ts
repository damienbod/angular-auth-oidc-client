import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { JwtKey, JwtKeys } from '../../validation/jwtkeys';
import { ValidationResult } from '../../validation/validation-result';
import { AuthResult, CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { SigninKeyDataService } from '../signin-key-data.service';
import { SigninKeyStoredService } from '../signin-key-stored.service';
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
  let signInKeyStoredService: SigninKeyStoredService;
  let getStoredSigningKeysSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HistoryJwtKeysCallbackHandlerService,
        mockProvider(LoggerService),
        mockProvider(AuthStateService),
        mockProvider(FlowsDataService),
        mockProvider(SigninKeyDataService),
        mockProvider(StoragePersistenceService),
        mockProvider(ResetAuthDataService),
        mockProvider(SigninKeyStoredService),
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
    signInKeyStoredService = TestBed.inject(SigninKeyStoredService);

    getStoredSigningKeysSpy = spyOn(
      signInKeyStoredService,
      'getSigningKeys'
    ).and.returnValue(
      throwError(() => new Error('No stored signing key'))
    );
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
      const storeSigningKeysSpy = spyOn(
        signInKeyStoredService,
        'storeSigningKeys'
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
      const DUMMY_JWT_KEYS_LOCAL = { keys: [] } as JwtKeys;

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of(DUMMY_JWT_KEYS_LOCAL)
      );

      service
        .callbackHistoryAndResetJwtKeys(
          callbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          next: () => {
            expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith(
              'authnResult',
              DUMMY_AUTH_RESULT,
              allconfigs[0]
            );

            expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(1);

            expect(storeSigningKeysSpy).toHaveBeenCalledOnceWith(
              DUMMY_JWT_KEYS,
              allconfigs[0]
            );
          },
          error: fail,
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
      const storeSigningKeysSpy = spyOn(
        signInKeyStoredService,
        'storeSigningKeys'
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
          ]);

          expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(1);

          expect(storeSigningKeysSpy).toHaveBeenCalledOnceWith(
            { keys: [] },
            allconfigs[0]
          );
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
      const storeSigningKeysSpy = spyOn(
        signInKeyStoredService,
        'storeSigningKeys'
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
          ]);

          expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(2);

          expect(storeSigningKeysSpy).toHaveBeenCalledOnceWith(
            { keys: [] },
            allconfigs[0]
          );
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

      spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(
        of({} as JwtKeys)
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
              `Failed to retrieve signing key with error: Error: error`
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
        isRenewProcess: false,
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
              isRenewProcess: false,
              configId: 'configId1',
            });
          },
        });
    }));

    it('calls authStateService.updateAndPublishAuthState with login required if the error is `login_required`', waitForAsync(() => {
      const callbackContext = {
        authResult: { error: 'login_required' },
        isRenewProcess: false,
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
              isRenewProcess: false,
              configId: 'configId1',
            });
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

    it('should use stored jwtKeys without retrieving them from the endpoint', waitForAsync(() => {
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

      getStoredSigningKeysSpy.and.returnValue(of(DUMMY_JWT_KEYS));

      const getSigningKeysSpy = spyOn(
        signInKeyDataService,
        'getSigningKeys'
      );

      service
        .callbackHistoryAndResetJwtKeys(
          initialCallbackContext,
          allconfigs[0],
          allconfigs
        )
        .subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(getStoredSigningKeysSpy).toHaveBeenCalledOnceWith(
              DUMMY_AUTH_RESULT.id_token,
              allconfigs[0]
            );

            expect(getSigningKeysSpy).not.toHaveBeenCalled();

            expect(callbackContext.jwtKeys).toEqual(DUMMY_JWT_KEYS);
          },
          error: fail,
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
