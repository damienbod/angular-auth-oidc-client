import { DOCUMENT } from '@angular/common';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { AuthStateServiceMock } from '../../auth-state/auth-state.service-mock';
import { LoggerService } from '../../logging/logger.service';
import { StateValidationResult } from '../../validation/state-validation-result';
import { StateValidationService } from '../../validation/state-validation.service';
import { StateValidationServiceMock } from '../../validation/state-validation.service-mock';
import { ValidationResult } from '../../validation/validation-result';
import { CallbackContext } from '../callback-context';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { StateValidationCallbackHandlerService } from './state-validation-callback-handler.service';

describe('StateValidationCallbackHandlerService', () => {
  let service: StateValidationCallbackHandlerService;
  let stateValidationService: StateValidationService;
  let loggerService: LoggerService;
  let authStateService: AuthStateService;
  let resetAuthDataService: ResetAuthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StateValidationCallbackHandlerService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: StateValidationService, useClass: StateValidationServiceMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: ResetAuthDataService, useClass: mockClass(ResetAuthDataService) },
        {
          provide: DOCUMENT,
          useValue: {
            location: {
              get hash() {
                return '&anyFakeHash';
              },
              set hash(v) {},
            },
          },
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(StateValidationCallbackHandlerService);
    stateValidationService = TestBed.inject(StateValidationService);
    loggerService = TestBed.inject(LoggerService);
    authStateService = TestBed.inject(AuthStateService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('callbackStateValidation', () => {
    it(
      'returns callbackContext with validationResult if validationResult is valid',
      waitForAsync(() => {
        spyOn(stateValidationService, 'getValidatedStateResult').and.returnValue(
          of({
            idToken: 'idTokenJustForTesting',
            authResponseIsValid: true,
          } as StateValidationResult)
        );
        const allConfigs = [{ configId: 'configId1' }];

        service.callbackStateValidation({} as CallbackContext, allConfigs[0], allConfigs).subscribe((newCallbackContext) => {
          expect(newCallbackContext).toEqual({
            validationResult: {
              idToken: 'idTokenJustForTesting',
              authResponseIsValid: true,
            },
          } as CallbackContext);
        });
      })
    );

    it(
      'logs error in case of an error',
      waitForAsync(() => {
        spyOn(stateValidationService, 'getValidatedStateResult').and.returnValue(
          of({
            authResponseIsValid: false,
          } as StateValidationResult)
        );

        const loggerSpy = spyOn(loggerService, 'logWarning');
        const allConfigs = [{ configId: 'configId1' }];

        service.callbackStateValidation({} as CallbackContext, allConfigs[0], allConfigs).subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalledOnceWith(
              allConfigs[0],
              'authorizedCallback, token(s) validation failed, resetting. Hash: &anyFakeHash'
            );
          },
        });
      })
    );

    it(
      'calls resetAuthDataService.resetAuthorizationData and authStateService.updateAndPublishAuthState in case of an error',
      waitForAsync(() => {
        spyOn(stateValidationService, 'getValidatedStateResult').and.returnValue(
          of({
            authResponseIsValid: false,
            state: ValidationResult.LoginRequired,
          } as StateValidationResult)
        );

        const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');
        const updateAndPublishAuthStateSpy = spyOn(authStateService, 'updateAndPublishAuthState');
        const allConfigs = [{ configId: 'configId1' }];

        service.callbackStateValidation({ isRenewProcess: true } as CallbackContext, allConfigs[0], allConfigs).subscribe({
          error: (err) => {
            expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
            expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.LoginRequired,
              isRenewProcess: true,
            });
          },
        });
      })
    );
  });
});
