import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthStateServiceMock } from '../../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { ConfigurationProviderMock } from '../../config/provider/config.provider-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../../storage/storage-persistence.service-mock';
import { JwtKey, JwtKeys } from '../../validation/jwtkeys';
import { ValidationResult } from '../../validation/validation-result';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { FlowsDataServiceMock } from '../flows-data.service-mock';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../reset-auth-data.service-mock';
import { SigninKeyDataService } from '../signin-key-data.service';
import { SigninKeyDataServiceMock } from '../signin-key-data.service-mock';
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
  let configurationProvider: ConfigurationProvider;
  let signInKeyDataService: SigninKeyDataService;
  let resetAuthDataService: ResetAuthDataService;
  let flowsDataService: FlowsDataService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HistoryJwtKeysCallbackHandlerService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: SigninKeyDataService, useClass: SigninKeyDataServiceMock },
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(HistoryJwtKeysCallbackHandlerService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
    signInKeyDataService = TestBed.inject(SigninKeyDataService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('callbackHistoryAndResetJwtKeys', () => {
    it(
      'writes authResult into the storage',
      waitForAsync(() => {
        const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'write');
        const callbackContext = ({ authResult: 'authResultToStore' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });

        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(of({ keys: [] } as JwtKeys));
        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe(() => {
          expect(storagePersistenceServiceSpy).toHaveBeenCalledWith('authnResult', 'authResultToStore', 'configId');

          // write authnResult & jwtKeys
          expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(2);
        });
      })
    );

    it(
      'resetBrowserHistory if historyCleanup is turned on and is not in a renewProcess',
      waitForAsync(() => {
        const callbackContext = ({ isRenewProcess: false, authResult: 'authResult' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: false });

        const windowSpy = spyOn(window.history, 'replaceState');

        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(of({ keys: [] } as JwtKeys));
        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe(() => {
          expect(windowSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'returns callbackContext with jwtkeys filled if everything works fine',
      waitForAsync(() => {
        const callbackContext = ({ isRenewProcess: false, authResult: 'authResult' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: false });

        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(of({ keys: [{ kty: 'henlo' } as JwtKey] } as JwtKeys));
        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe((result) => {
          expect(result).toEqual(({
            isRenewProcess: false,
            authResult: 'authResult',
            jwtKeys: { keys: [{ kty: 'henlo' }] },
          } as unknown) as CallbackContext);
        });
      })
    );

    it(
      'returns error if no jwtKeys have been in the call',
      waitForAsync(() => {
        const callbackContext = ({ isRenewProcess: false, authResult: 'authResult' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: false });

        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(of(null));
        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          error: (err) => {
            expect(err).toEqual(`Failed to retrieve signing key with error: Failed to retrieve signing key`);
          },
        });
      })
    );

    it(
      'returns error if no jwtKeys have been in the call',
      waitForAsync(() => {
        const callbackContext = ({ isRenewProcess: false, authResult: 'authResult' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: false });

        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(throwError('WOAH SOMETHING BAD HAPPENED'));
        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          error: (err) => {
            expect(err).toEqual(`Failed to retrieve signing key with error: WOAH SOMETHING BAD HAPPENED`);
          },
        });
      })
    );

    it(
      'returns error if callbackContext.authresult has an error property filled',
      waitForAsync(() => {
        const callbackContext = ({ authResult: { error: 'someError' } } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });

        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          error: (err) => {
            expect(err).toEqual(`AuthCallback AuthResult came with error: someError`);
          },
        });
      })
    );

    it(
      'calls resetAuthorizationData, resets nonce and authStateService in case of an error',
      waitForAsync(() => {
        const callbackContext = ({ authResult: { error: 'someError' } } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });

        const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');
        const setNonceSpy = spyOn(flowsDataService, 'setNonce');
        const updateAndPublishAuthStateSpy = spyOn(authStateService, 'updateAndPublishAuthState');

        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          error: (err) => {
            expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
            expect(setNonceSpy).toHaveBeenCalledTimes(1);
            expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.SecureTokenServerError,
              isRenewProcess: undefined,
            });
          },
        });
      })
    );

    it(
      'calls authStateService.updateAndPublishAuthState with login required if the error is `login_required`',
      waitForAsync(() => {
        const callbackContext = ({ authResult: { error: 'login_required' } } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });

        const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');
        const setNonceSpy = spyOn(flowsDataService, 'setNonce');
        const updateAndPublishAuthStateSpy = spyOn(authStateService, 'updateAndPublishAuthState');

        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          error: (err) => {
            expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
            expect(setNonceSpy).toHaveBeenCalledTimes(1);
            expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.LoginRequired,
              isRenewProcess: undefined,
            });
          },
        });
      })
    );

    it(
      'should store jwtKeys',
      waitForAsync(() => {
        const callbackContext = ({ authResult: 'authResultToStore' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });
        const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'write');
        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(of(DUMMY_JWT_KEYS));

        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(storagePersistenceServiceSpy).toHaveBeenCalledWith('authnResult', 'authResultToStore', 'configId');
            expect(storagePersistenceServiceSpy).toHaveBeenCalledWith('jwtKeys', DUMMY_JWT_KEYS, 'configId');
            expect(storagePersistenceServiceSpy).toHaveBeenCalledTimes(2);

            expect(callbackContext.jwtKeys).toEqual(DUMMY_JWT_KEYS);
          },
          error: (err) => {
            expect(err).toBeFalsy();
          },
        });
      })
    );

    it(
      'should not store jwtKeys on error',
      waitForAsync(() => {
        const callbackContext = ({ authResult: 'authResultToStore' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });
        const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'write');
        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(throwError({}));

        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(callbackContext).toBeFalsy();
          },
          error: (err) => {
            expect(err).toBeTruthy();

            // storagePersistenceService.write() should not have been called with jwtKeys
            expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith('authnResult', 'authResultToStore');
          },
        });
      })
    );

    it(
      'should fallback to stored jwtKeys on error',
      waitForAsync(() => {
        const callbackContext = ({ authResult: 'authResultToStore' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });
        const storagePersistenceServiceSpy = spyOn(storagePersistenceService, 'read');
        storagePersistenceServiceSpy.and.returnValue(DUMMY_JWT_KEYS);
        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(throwError({}));

        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(storagePersistenceServiceSpy).toHaveBeenCalledOnceWith('jwtKeys');
            expect(callbackContext.jwtKeys).toEqual(DUMMY_JWT_KEYS);
          },
          error: (err) => {
            expect(err).toBeFalsy();
          },
        });
      })
    );

    it(
      'should throw error if no jwtKeys are stored',
      waitForAsync(() => {
        const callbackContext = ({ authResult: 'authResultToStore' } as unknown) as CallbackContext;
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ historyCleanupOff: true });
        spyOn(storagePersistenceService, 'read').and.returnValue(null);
        spyOn(signInKeyDataService, 'getSigningKeys').and.returnValue(throwError({}));

        service.callbackHistoryAndResetJwtKeys(callbackContext, 'configId').subscribe({
          next: (callbackContext: CallbackContext) => {
            expect(callbackContext).toBeFalsy();
          },
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });

  describe('historyCleanUpTurnedOn ', () => {
    it('check for false if historyCleanUpTurnedOn is on', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
        historyCleanupOff: true,
      });

      const value = (service as any).historyCleanUpTurnedOn();
      expect(value).toEqual(false);
    });

    it('check for true if historyCleanUpTurnedOn is off', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
        historyCleanupOff: false,
      });

      const value = (service as any).historyCleanUpTurnedOn();
      expect(value).toEqual(true);
    });
  });
});
