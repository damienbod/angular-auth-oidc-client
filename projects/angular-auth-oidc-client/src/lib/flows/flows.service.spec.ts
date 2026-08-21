import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
import { RefreshSessionCallbackHandlerService } from './callback-handling/refresh-session-callback-handler.service';
import { RefreshTokenCallbackHandlerService } from './callback-handling/refresh-token-callback-handler.service';
import { StateValidationCallbackHandlerService } from './callback-handling/state-validation-callback-handler.service';
import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';
import { FlowsService } from './flows.service';

describe('Flows Service', () => {
  let service: FlowsService;
  let codeFlowCallbackHandlerService: CodeFlowCallbackHandlerService;
  let implicitFlowCallbackHandlerService: ImplicitFlowCallbackHandlerService;
  let historyJwtKeysCallbackHandlerService: HistoryJwtKeysCallbackHandlerService;
  let userCallbackHandlerService: UserCallbackHandlerService;
  let stateValidationCallbackHandlerService: StateValidationCallbackHandlerService;
  let refreshSessionCallbackHandlerService: RefreshSessionCallbackHandlerService;
  let refreshTokenCallbackHandlerService: RefreshTokenCallbackHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FlowsService,
        mockProvider(CodeFlowCallbackHandlerService),
        mockProvider(ImplicitFlowCallbackHandlerService),
        mockProvider(HistoryJwtKeysCallbackHandlerService),
        mockProvider(UserCallbackHandlerService),
        mockProvider(StateValidationCallbackHandlerService),
        mockProvider(RefreshSessionCallbackHandlerService),
        mockProvider(RefreshTokenCallbackHandlerService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(FlowsService);
    codeFlowCallbackHandlerService = TestBed.inject(
      CodeFlowCallbackHandlerService
    );
    implicitFlowCallbackHandlerService = TestBed.inject(
      ImplicitFlowCallbackHandlerService
    );
    historyJwtKeysCallbackHandlerService = TestBed.inject(
      HistoryJwtKeysCallbackHandlerService
    );
    userCallbackHandlerService = TestBed.inject(UserCallbackHandlerService);
    stateValidationCallbackHandlerService = TestBed.inject(
      StateValidationCallbackHandlerService
    );
    refreshSessionCallbackHandlerService = TestBed.inject(
      RefreshSessionCallbackHandlerService
    );
    refreshTokenCallbackHandlerService = TestBed.inject(
      RefreshTokenCallbackHandlerService
    );
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('processCodeFlowCallback', () => {
    it('calls all methods correctly', waitForAsync(() => {
      const codeFlowCallbackSpy = vi
        .spyOn(codeFlowCallbackHandlerService, 'codeFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      const codeFlowCodeRequestSpy = vi
        .spyOn(codeFlowCallbackHandlerService, 'codeFlowCodeRequest')
        .mockReturnValue(of({} as CallbackContext));
      const callbackHistoryAndResetJwtKeysSpy = vi
        .spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        )
        .mockReturnValue(of({} as CallbackContext));
      const callbackStateValidationSpy = vi
        .spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation')
        .mockReturnValue(of({} as CallbackContext));
      const callbackUserSpy = vi
        .spyOn(userCallbackHandlerService, 'callbackUser')
        .mockReturnValue(of({} as CallbackContext));
      const allConfigs = [
        {
          configId: 'configId1',
        },
      ];

      service
        .processCodeFlowCallback('some-url1234', allConfigs[0], allConfigs)
        .subscribe((value) => {
          expect(value).toEqual({} as CallbackContext);
          expect(codeFlowCallbackSpy).toHaveBeenCalledTimes(1);
          expect(codeFlowCallbackSpy).toHaveBeenCalledWith(
            'some-url1234',
            allConfigs[0]
          );
          expect(codeFlowCodeRequestSpy).toHaveBeenCalledTimes(1);
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalledTimes(1);
          expect(callbackStateValidationSpy).toHaveBeenCalledTimes(1);
          expect(callbackUserSpy).toHaveBeenCalledTimes(1);
        });
    }));
  });

  describe('processSilentRenewCodeFlowCallback', () => {
    it('calls all methods correctly', waitForAsync(() => {
      const codeFlowCodeRequestSpy = vi
        .spyOn(codeFlowCallbackHandlerService, 'codeFlowCodeRequest')
        .mockReturnValue(of({} as CallbackContext));
      const callbackHistoryAndResetJwtKeysSpy = vi
        .spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        )
        .mockReturnValue(of({} as CallbackContext));
      const callbackStateValidationSpy = vi
        .spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation')
        .mockReturnValue(of({} as CallbackContext));
      const callbackUserSpy = vi
        .spyOn(userCallbackHandlerService, 'callbackUser')
        .mockReturnValue(of({} as CallbackContext));
      const allConfigs = [
        {
          configId: 'configId1',
        },
      ];

      service
        .processSilentRenewCodeFlowCallback(
          {} as CallbackContext,
          allConfigs[0],
          allConfigs
        )
        .subscribe((value) => {
          expect(value).toEqual({} as CallbackContext);
          expect(codeFlowCodeRequestSpy).toHaveBeenCalled();
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
          expect(callbackStateValidationSpy).toHaveBeenCalled();
          expect(callbackUserSpy).toHaveBeenCalled();
        });
    }));
  });

  describe('processImplicitFlowCallback', () => {
    it('calls all methods correctly', waitForAsync(() => {
      const implicitFlowCallbackSpy = vi
        .spyOn(implicitFlowCallbackHandlerService, 'implicitFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      const callbackHistoryAndResetJwtKeysSpy = vi
        .spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        )
        .mockReturnValue(of({} as CallbackContext));
      const callbackStateValidationSpy = vi
        .spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation')
        .mockReturnValue(of({} as CallbackContext));
      const callbackUserSpy = vi
        .spyOn(userCallbackHandlerService, 'callbackUser')
        .mockReturnValue(of({} as CallbackContext));
      const allConfigs = [
        {
          configId: 'configId1',
        },
      ];

      service
        .processImplicitFlowCallback(allConfigs[0], allConfigs, 'any-hash')
        .subscribe((value) => {
          expect(value).toEqual({} as CallbackContext);
          expect(implicitFlowCallbackSpy).toHaveBeenCalled();
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
          expect(callbackStateValidationSpy).toHaveBeenCalled();
          expect(callbackUserSpy).toHaveBeenCalled();
        });
    }));
  });

  describe('processRefreshToken', () => {
    it('calls all methods correctly', waitForAsync(() => {
      const refreshSessionWithRefreshTokensSpy = vi
        .spyOn(
          refreshSessionCallbackHandlerService,
          'refreshSessionWithRefreshTokens'
        )
        .mockReturnValue(of({} as CallbackContext));
      const refreshTokensRequestTokensSpy = vi
        .spyOn(refreshTokenCallbackHandlerService, 'refreshTokensRequestTokens')
        .mockReturnValue(of({} as CallbackContext));
      const callbackHistoryAndResetJwtKeysSpy = vi
        .spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        )
        .mockReturnValue(of({} as CallbackContext));
      const callbackStateValidationSpy = vi
        .spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation')
        .mockReturnValue(of({} as CallbackContext));
      const callbackUserSpy = vi
        .spyOn(userCallbackHandlerService, 'callbackUser')
        .mockReturnValue(of({} as CallbackContext));
      const allConfigs = [
        {
          configId: 'configId1',
        },
      ];

      service
        .processRefreshToken(allConfigs[0], allConfigs)
        .subscribe((value) => {
          expect(value).toEqual({} as CallbackContext);
          expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
          expect(refreshTokensRequestTokensSpy).toHaveBeenCalled();
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
          expect(callbackStateValidationSpy).toHaveBeenCalled();
          expect(callbackUserSpy).toHaveBeenCalled();
        });
    }));
  });
});
