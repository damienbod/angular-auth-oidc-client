import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { AuthStateServiceMock } from '../../auth-state/auth-state.service-mock';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { ConfigurationProviderMock } from '../../config/provider/config.provider-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { UserServiceMock } from '../../user-data/user-service-mock';
import { UserService } from '../../user-data/user.service';
import { StateValidationResult } from '../../validation/state-validation-result';
import { ValidationResult } from '../../validation/validation-result';
import { FlowsDataService } from '../flows-data.service';
import { FlowsDataServiceMock } from '../flows-data.service-mock';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../reset-auth-data.service-mock';
import { UserCallbackHandlerService } from './user-callback-handler.service';

describe('UserCallbackHandlerService', () => {
  let service: UserCallbackHandlerService;
  let configurationProvider: ConfigurationProvider;
  let authStateService: AuthStateService;
  let flowsDataService: FlowsDataService;
  let userService: UserService;
  let resetAuthDataService: ResetAuthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserCallbackHandlerService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: UserService, useClass: UserServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(UserCallbackHandlerService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
    userService = TestBed.inject(UserService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('callbackUser', () => {
    it(
      'calls flowsDataService.setSessionState with correct params if autoUserInfo is false, isRenewProcess is false and refreshToken is null',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded');
        const callbackContext = {
          code: null,
          refreshToken: null,
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: false });
        const spy = spyOn(flowsDataService, 'setSessionState');

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(spy).toHaveBeenCalledOnceWith('mystate', 'configId');
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'does NOT call flowsDataService.setSessionState if autoUserInfo is false, isRenewProcess is true and refreshToken is null',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded');
        const callbackContext = {
          code: null,
          refreshToken: null,
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: true,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: false });
        const spy = spyOn(flowsDataService, 'setSessionState');

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(spy).not.toHaveBeenCalled();
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'does NOT call flowsDataService.setSessionState if autoUserInfo is false isRenewProcess is false, refreshToken has value',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded');
        const callbackContext = {
          code: null,
          refreshToken: 'somerefreshtoken',
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: false });
        const spy = spyOn(flowsDataService, 'setSessionState');

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(spy).not.toHaveBeenCalled();
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'does NOT call flowsDataService.setSessionState if autoUserInfo is false isRenewProcess is false, refreshToken has value, id_token is false',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', '', true, '');
        const callbackContext = {
          code: null,
          refreshToken: 'somerefreshtoken',
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: false });
        const spy = spyOn(flowsDataService, 'setSessionState');

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(spy).not.toHaveBeenCalled();
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'calls authStateService.updateAndPublishAuthState with correct params if autoUserInfo is false',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded');
        const callbackContext = {
          code: null,
          refreshToken: 'somerefreshtoken',
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: false });
        const updateAndPublishAuthStateSpy = spyOn(authStateService, 'updateAndPublishAuthState');

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
            isAuthenticated: true,
            validationResult: ValidationResult.NotSet,
            isRenewProcess: false,
          });
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'calls userService.getAndPersistUserDataInStore with correct params if autoUserInfo is true',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded');
        const callbackContext = {
          code: null,
          refreshToken: 'somerefreshtoken',
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: true });
        const getAndPersistUserDataInStoreSpy = spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(
          of({ user: 'some_data' })
        );

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(getAndPersistUserDataInStoreSpy).toHaveBeenCalledOnceWith('configId', false, 'idtoken', 'decoded');
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'calls authStateService.updateAndPublishAuthState with correct params if autoUserInfo is true',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded', ValidationResult.MaxOffsetExpired);
        const callbackContext = {
          code: null,
          refreshToken: 'somerefreshtoken',
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: true });
        spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(of({ user: 'some_data' }));
        const updateAndPublishAuthStateSpy = spyOn(authStateService, 'updateAndPublishAuthState');

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
            isAuthenticated: true,
            validationResult: ValidationResult.MaxOffsetExpired,
            isRenewProcess: false,
          });
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'calls flowsDataService.setSessionState with correct params if user data is present and NOT refresh token',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded', ValidationResult.MaxOffsetExpired);
        const callbackContext = {
          code: null,
          refreshToken: '', // something falsy
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: true });
        spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(of({ user: 'some_data' }));
        const setSessionStateSpy = spyOn(flowsDataService, 'setSessionState');

        service.callbackUser(callbackContext, 'configId').subscribe((resultCallbackContext) => {
          expect(setSessionStateSpy).toHaveBeenCalledOnceWith('mystate', 'configId');
          expect(resultCallbackContext).toEqual(callbackContext);
        });
      })
    );

    it(
      'calls authStateService.publishUnauthorizedState with correct params if user info which are coming back are null',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded', ValidationResult.MaxOffsetExpired);
        const callbackContext = {
          code: null,
          refreshToken: 'somerefreshtoken',
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: true });
        spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(of(null));
        const updateAndPublishAuthStateSpy = spyOn(authStateService, 'updateAndPublishAuthState');

        service.callbackUser(callbackContext, 'configId').subscribe({
          error: (err) => {
            expect(updateAndPublishAuthStateSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.MaxOffsetExpired,
              isRenewProcess: false,
            });
            expect(err).toEqual('Failed to retrieve user info with error:  Called for userData but they were null');
          },
        });
      })
    );

    it(
      'calls resetAuthDataService.resetAuthorizationData if user info which are coming back are null',
      waitForAsync(() => {
        const svr = new StateValidationResult('accesstoken', 'idtoken', true, 'decoded', ValidationResult.MaxOffsetExpired);
        const callbackContext = {
          code: null,
          refreshToken: 'somerefreshtoken',
          state: null,
          sessionState: null,
          authResult: { session_state: 'mystate' },
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: svr,
          existingIdToken: null,
        };

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ autoUserInfo: true });
        spyOn(userService, 'getAndPersistUserDataInStore').and.returnValue(of(null));
        const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');

        service.callbackUser(callbackContext, 'configId').subscribe({
          error: (err) => {
            expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
            expect(err).toEqual('Failed to retrieve user info with error:  Called for userData but they were null');
          },
        });
      })
    );
  });
});
