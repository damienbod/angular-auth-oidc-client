import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { LoggerService } from '../../logging/logger.service';
import { UserService } from '../../user-data/user.service';
import { StateValidationResult } from '../../validation/state-validation-result';
import { ValidationResult } from '../../validation/validation-result';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { UserCallbackHandlerService } from './user-callback-handler.service';

describe('UserCallbackHandlerService', () => {
  let service: UserCallbackHandlerService;
  let authStateService: AuthStateService;
  let flowsDataService: FlowsDataService;
  let userService: UserService;
  let resetAuthDataService: ResetAuthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserCallbackHandlerService,
        mockProvider(LoggerService),
        mockProvider(AuthStateService),
        mockProvider(FlowsDataService),
        mockProvider(UserService),
        mockProvider(ResetAuthDataService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(UserCallbackHandlerService);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
    userService = TestBed.inject(UserService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('callbackUser', () => {
    it('calls flowsDataService.setSessionState with correct params if autoUserInfo is false, isRenewProcess is false and refreshToken is null', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded'
      );
      const callbackContext = {
        code: '',
        refreshToken: '',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: '',
      } as CallbackContext;      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: false,
        },
      ];      const spy = spyOn(flowsDataService, 'setSessionState');

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(spy).toHaveBeenCalledOnceWith('mystate', allConfigs[0]);
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('does NOT call flowsDataService.setSessionState if autoUserInfo is false, isRenewProcess is true and refreshToken is null', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded'
      );
      const callbackContext = {
        code: '',
        refreshToken: '',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;
      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: false,
        },
      ];
      const spy = spyOn(flowsDataService, 'setSessionState');

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(spy).not.toHaveBeenCalled();
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('does NOT call flowsDataService.setSessionState if autoUserInfo is false isRenewProcess is false, refreshToken has value', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded'
      );
      const callbackContext = {
        code: '',
        refreshToken: 'somerefreshtoken',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;
      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: false,
        },
      ];
      const spy = spyOn(flowsDataService, 'setSessionState');

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(spy).not.toHaveBeenCalled();
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('does NOT call flowsDataService.setSessionState if autoUserInfo is false isRenewProcess is false, refreshToken has value, id_token is false', waitForAsync(() => {
      const svr = new StateValidationResult('accesstoken', '', true, '');
      const callbackContext = {
        code: '',
        refreshToken: 'somerefreshtoken',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;
      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: false,
        },
      ];      const spy = spyOn(flowsDataService, 'setSessionState');

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(spy).not.toHaveBeenCalled();
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('calls authStateService.updateAndPublishAuthState with correct params if autoUserInfo is false', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded'
      );
      const callbackContext = {
        code: '',
        refreshToken: 'somerefreshtoken',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: false,
        },
      ];      const updateAndPublishAuthStateSpy = spyOn(
        authStateService,
        'updateAndPublishAuthState'
      );

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
            isAuthenticated: true,
            validationResult: ValidationResult.NotSet,
            isRenewProcess: false,
            configId: 'configId1',
          });
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('calls userService.getAndPersistUserDataInStore with correct params if autoUserInfo is true', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded'
      );
      const callbackContext = {
        code: '',
        refreshToken: 'somerefreshtoken',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: true,
        },
      ];      const getAndPersistUserDataInStoreSpy = spyOn(
        userService,
        'getAndPersistUserDataInStore'
      ).and.returnValue(of({ user: 'some_data' }));

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(getAndPersistUserDataInStoreSpy).toHaveBeenCalledOnceWith(
            allConfigs[0],
            allConfigs,
            false,
            'idtoken',
            'decoded'
          );
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('calls authStateService.updateAndPublishAuthState with correct params if autoUserInfo is true', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded',
        ValidationResult.MaxOffsetExpired
      );
      const callbackContext = {
        code: '',
        refreshToken: 'somerefreshtoken',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: true,
        },
      ];

      spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(
        of({ user: 'some_data' })
      );
      const updateAndPublishAuthStateSpy = spyOn(
        authStateService,
        'updateAndPublishAuthState'
      );

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
            isAuthenticated: true,
            validationResult: ValidationResult.MaxOffsetExpired,
            isRenewProcess: false,
            configId: 'configId1',
          });
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('calls flowsDataService.setSessionState with correct params if user data is present and NOT refresh token', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded',
        ValidationResult.MaxOffsetExpired
      );
      const callbackContext = {
        code: '',
        refreshToken: '', // something falsy
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: true,
        },
      ];

      spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(
        of({ user: 'some_data' })
      );
      const setSessionStateSpy = spyOn(flowsDataService, 'setSessionState');

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe((resultCallbackContext) => {
          expect(setSessionStateSpy).toHaveBeenCalledOnceWith(
            'mystate',
            allConfigs[0]
          );
          expect(resultCallbackContext).toEqual(callbackContext);
        });
    }));

    it('calls authStateService.publishUnauthorizedState with correct params if user info which are coming back are null', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded',
        ValidationResult.MaxOffsetExpired
      );
      const callbackContext = {
        code: '',
        refreshToken: 'somerefreshtoken',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: true,
        },
      ];

      spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(
        of(null)
      );
      const updateAndPublishAuthStateSpy = spyOn(
        authStateService,
        'updateAndPublishAuthState'
      );

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe({
          error: (err) => {
            expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.MaxOffsetExpired,
              isRenewProcess: false,
              configId: 'configId1',
            });
            expect(err.message).toEqual(
              'Failed to retrieve user info with error:  Error: Called for userData but they were null'
            );
          },
        });
    }));

    it('calls resetAuthDataService.resetAuthorizationData if user info which are coming back are null', waitForAsync(() => {
      const svr = new StateValidationResult(
        'accesstoken',
        'idtoken',
        true,
        'decoded',
        ValidationResult.MaxOffsetExpired
      );
      const callbackContext = {
        code: '',
        refreshToken: 'somerefreshtoken',
        state: '',
        sessionState: null,
        authResult: { session_state: 'mystate' },
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: svr,
        existingIdToken: null,
      } as CallbackContext;      const allConfigs = [
        {
          configId: 'configId1',
          autoUserInfo: true,
        },
      ];

      spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(
        of(null)
      );
      const resetAuthorizationDataSpy = spyOn(
        resetAuthDataService,
        'resetAuthorizationData'
      );

      service
        .callbackUser(callbackContext, allConfigs[0], allConfigs)
        .subscribe({
          error: (err) => {
            expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
            expect(err.message).toEqual(
              'Failed to retrieve user info with error:  Error: Called for userData but they were null'
            );
          },
        });
    }));
  });
});
