import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { ImplicitFlowCallbackService } from '../callback/implicit-flow-callback.service';
import { IntervalService } from '../callback/interval.service';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/services/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ValidationResult } from '../validation/validation-result';
import { IFrameService } from './existing-iframe.service';
import {
  SilentRenewCallbackError,
  SilentRenewService,
} from './silent-renew.service';

describe('SilentRenewService  ', () => {
  beforeEach(() => {
    vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  let silentRenewService: SilentRenewService;
  let flowHelper: FlowHelper;
  let implicitFlowCallbackService: ImplicitFlowCallbackService;
  let iFrameService: IFrameService;
  let flowsDataService: FlowsDataService;
  let loggerService: LoggerService;
  let flowsService: FlowsService;
  let authStateService: AuthStateService;
  let resetAuthDataService: ResetAuthDataService;
  let intervalService: IntervalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SilentRenewService,
        IFrameService,
        mockProvider(FlowsService),
        mockProvider(ResetAuthDataService),
        mockProvider(FlowsDataService),
        mockProvider(AuthStateService),
        mockProvider(LoggerService),
        mockProvider(ImplicitFlowCallbackService),
        mockProvider(IntervalService),
        FlowHelper,
      ],
    });
  });

  beforeEach(() => {
    silentRenewService = TestBed.inject(SilentRenewService);
    iFrameService = TestBed.inject(IFrameService);
    flowHelper = TestBed.inject(FlowHelper);
    implicitFlowCallbackService = TestBed.inject(ImplicitFlowCallbackService);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowsService = TestBed.inject(FlowsService);
    loggerService = TestBed.inject(LoggerService);
    authStateService = TestBed.inject(AuthStateService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
    intervalService = TestBed.inject(IntervalService);
  });

  it('should create', () => {
    expect(silentRenewService).toBeTruthy();
  });

  describe('refreshSessionWithIFrameCompleted', () => {
    it('should be of type observable', () => {
      expect(silentRenewService.refreshSessionWithIFrameCompleted$).toEqual(
        expect.any(Observable)
      );
    });
  });

  describe('isSilentRenewConfigured', () => {
    it('should return true if refreshToken is configured false and silentRenew is configured true', () => {
      const config = { useRefreshToken: false, silentRenew: true };
      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(true);
    });

    it('should return false if refreshToken is configured true and silentRenew is configured true', () => {
      const config = { useRefreshToken: true, silentRenew: true };
      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(false);
    });

    it('should return false if refreshToken is configured false and silentRenew is configured false', () => {
      const config = { useRefreshToken: false, silentRenew: false };
      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(false);
    });
  });

  describe('getOrCreateIframe', () => {
    it('should return iframe if iframe is truthy', () => {
      const config = { configId: 'configId1' };
      const mockIframe = { name: 'anything' } as HTMLIFrameElement;

      vi.spyOn(iFrameService, 'getExistingIFrame').mockReturnValue(mockIframe);

      const result = silentRenewService.getOrCreateIframe(config);

      expect(result).toEqual(mockIframe);
      expect(iFrameService.getExistingIFrame).toHaveBeenCalledTimes(1);
      expect(iFrameService.getExistingIFrame).toHaveBeenCalledWith(
        'myiFrameForSilentRenew_configId1'
      );
    });

    it('should add iframe to body if existing iframe is falsy', () => {
      const config = { configId: 'configId1' };

      vi.spyOn(iFrameService, 'getExistingIFrame').mockReturnValue(null);

      const spy = vi
        .spyOn(iFrameService, 'addIFrameToWindowBody')
        .mockReturnValue({ name: 'anything' } as HTMLIFrameElement);
      const result = silentRenewService.getOrCreateIframe(config);

      expect(result).toEqual({ name: 'anything' } as HTMLIFrameElement);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        'myiFrameForSilentRenew_configId1',
        config
      );
    });
  });

  describe('getOrCreateIframe logging', () => {
    it('should log that a new iframe is created when no iframe exists yet', () => {
      // Arrange
      const config = { configId: 'configId1' };
      const logDebugSpy = vi.spyOn(loggerService, 'logDebug');

      vi.spyOn(iFrameService, 'getExistingIFrame').mockReturnValue(null);
      vi.spyOn(iFrameService, 'addIFrameToWindowBody').mockReturnValue({
        name: 'anything',
      } as HTMLIFrameElement);

      // Act
      silentRenewService.getOrCreateIframe(config);

      // Assert
      expect(logDebugSpy).toHaveBeenCalledExactlyOnceWith(
        config,
        'Creating new iframe: myiFrameForSilentRenew_configId1'
      );
    });

    it('should log that the existing iframe is reused when one exists', () => {
      // Arrange
      const config = { configId: 'configId1' };
      const logDebugSpy = vi.spyOn(loggerService, 'logDebug');
      const addIFrameToWindowBodySpy = vi.spyOn(
        iFrameService,
        'addIFrameToWindowBody'
      );

      vi.spyOn(iFrameService, 'getExistingIFrame').mockReturnValue({
        name: 'anything',
      } as HTMLIFrameElement);

      // Act
      silentRenewService.getOrCreateIframe(config);

      // Assert
      expect(logDebugSpy).toHaveBeenCalledExactlyOnceWith(
        config,
        'Using existing iframe: myiFrameForSilentRenew_configId1'
      );
      expect(addIFrameToWindowBodySpy).not.toHaveBeenCalled();
    });
  });

  describe('codeFlowCallbackSilentRenewIframe', () => {
    it('should call processSilentRenewCodeFlowCallback with correct arguments', async () => {
      const config = { configId: 'configId1' };
      const allConfigs = [config];
      const spy = vi
        .spyOn(flowsService, 'processSilentRenewCodeFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      const expectedContext = {
        code: 'some-code',
        refreshToken: '',
        state: 'some-state',
        sessionState: 'some-session-state',
        authResult: null,
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: null,
      } as CallbackContext;
      const url = 'url-part-1';
      const urlParts =
        'code=some-code&state=some-state&session_state=some-session-state';

      await firstValueFrom(
        silentRenewService.codeFlowCallbackSilentRenewIframe(
          [url, urlParts],
          config,
          allConfigs
        )
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expectedContext, config, allConfigs);
    });

    it('should throw error if url has error param and reset everything on error', async () => {
      const config = { configId: 'configId1' };
      const allConfigs = [config];
      const spy = vi
        .spyOn(flowsService, 'processSilentRenewCodeFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      const authStateServiceSpy = vi
        .spyOn(authStateService, 'updateAndPublishAuthState')
        .mockReturnValue(undefined);
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);
      const setNonceSpy = vi
        .spyOn(flowsDataService, 'setNonce')
        .mockReturnValue(undefined);
      const stopPeriodicTokenCheckSpy = vi
        .spyOn(intervalService, 'stopPeriodicTokenCheck')
        .mockReturnValue(undefined);
      const url = 'url-part-1';
      const urlParts = 'error=some_error';

      try {
        await firstValueFrom(
          silentRenewService.codeFlowCallbackSilentRenewIframe(
            [url, urlParts],
            config,
            allConfigs
          )
        );
        expect.fail('expected an error');
      } catch (error: any) {
        expect(error).toEqual(new Error('some_error'));
        expect(spy).not.toHaveBeenCalled();
        expect(authStateServiceSpy).toHaveBeenCalledTimes(1);
        expect(authStateServiceSpy).toHaveBeenCalledWith({
          isAuthenticated: false,
          validationResult: ValidationResult.LoginRequired,
          isRenewProcess: true,
          configId: 'configId1',
        });
        expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(1);
        expect(resetAuthorizationDataSpy).toHaveBeenCalledWith(
          config,
          allConfigs
        );
        expect(setNonceSpy).toHaveBeenCalledTimes(1);
        expect(setNonceSpy).toHaveBeenCalledWith('', config);
        expect(stopPeriodicTokenCheckSpy).toHaveBeenCalledTimes(1);
      }
    });

    it('should keep the error_description of the url on the thrown error', async () => {
      const config = { configId: 'configId1' };
      const allConfigs = [config];
      const url = 'url-part-1';
      const urlParts = 'error=some_error&error_description=some_description';

      try {
        await firstValueFrom(
          silentRenewService.codeFlowCallbackSilentRenewIframe(
            [url, urlParts],
            config,
            allConfigs
          )
        );
        expect.fail('expected an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(SilentRenewCallbackError);
        expect(error.message).toBe('some_error');
        expect(error.errorDescription).toBe('some_description');
      }
    });
  });

  describe('codeFlowCallbackSilentRenewIframe edge cases', () => {
    it('should pass empty code and state to the flow when the url has no code and state params', async () => {
      // Arrange
      const config = { configId: 'configId1' };
      const allConfigs = [config];
      const spy = vi
        .spyOn(flowsService, 'processSilentRenewCodeFlowCallback')
        .mockReturnValue(of({} as CallbackContext));

      // Act
      await firstValueFrom(
        silentRenewService.codeFlowCallbackSilentRenewIframe(
          ['url-part-1', 'session_state=some-session-state'],
          config,
          allConfigs
        )
      );

      // Assert
      expect(spy).toHaveBeenCalledExactlyOnceWith(
        {
          code: '',
          refreshToken: '',
          state: '',
          sessionState: 'some-session-state',
          authResult: null,
          isRenewProcess: true,
          jwtKeys: null,
          validationResult: null,
          existingIdToken: null,
        },
        config,
        allConfigs
      );
    });

    it('should stop the periodic token check, reset the authorization data and rethrow when processing the callback fails', async () => {
      // Arrange
      const config = { configId: 'configId1' };
      const allConfigs = [config];

      vi.spyOn(
        flowsService,
        'processSilentRenewCodeFlowCallback'
      ).mockReturnValue(throwError(() => 'processing failed'));
      const stopPeriodicTokenCheckSpy = vi
        .spyOn(intervalService, 'stopPeriodicTokenCheck')
        .mockReturnValue(undefined);
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);
      // Act
      const result = firstValueFrom(
        silentRenewService.codeFlowCallbackSilentRenewIframe(
          ['url-part-1', 'code=some-code&state=some-state'],
          config,
          allConfigs
        )
      );

      // Assert
      await expect(result).rejects.toEqual(new Error('processing failed'));
      expect(stopPeriodicTokenCheckSpy).toHaveBeenCalledTimes(1);
      expect(resetAuthorizationDataSpy).toHaveBeenCalledExactlyOnceWith(
        config,
        allConfigs
      );
    });
  });

  describe('silentRenewEventHandler', () => {
    it('should return if no details is given', async () => {
      const isCurrentFlowCodeFlowSpy = vi
        .spyOn(flowHelper, 'isCurrentFlowCodeFlow')
        .mockReturnValue(false);

      vi.spyOn(
        implicitFlowCallbackService,
        'authenticatedImplicitFlowCallback'
      ).mockReturnValue(of({} as CallbackContext));
      const eventData = { detail: null } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);
      expect(isCurrentFlowCodeFlowSpy).not.toHaveBeenCalled();
    });

    it('should call authorizedImplicitFlowCallback if current flow is not code flow', async () => {
      const isCurrentFlowCodeFlowSpy = vi
        .spyOn(flowHelper, 'isCurrentFlowCodeFlow')
        .mockReturnValue(false);
      const authorizedImplicitFlowCallbackSpy = vi
        .spyOn(implicitFlowCallbackService, 'authenticatedImplicitFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      const eventData = { detail: 'detail' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);
      expect(isCurrentFlowCodeFlowSpy).toHaveBeenCalled();
      expect(authorizedImplicitFlowCallbackSpy).toHaveBeenCalledTimes(1);
      expect(authorizedImplicitFlowCallbackSpy).toHaveBeenCalledWith(
        allConfigs[0],
        allConfigs,
        'detail'
      );
    });

    it('should call codeFlowCallbackSilentRenewIframe if current flow is code flow', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const codeFlowCallbackSilentRenewIframe = vi
        .spyOn(silentRenewService, 'codeFlowCallbackSilentRenewIframe')
        .mockReturnValue(of({} as CallbackContext));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);
      expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledTimes(1);
      expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledWith(
        ['detail', 'detail2'],
        allConfigs[0],
        allConfigs
      );
    });

    it('should not call authenticatedImplicitFlowCallback if current flow is code flow', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      vi.spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).mockReturnValue(of({} as CallbackContext));
      const authenticatedImplicitFlowCallbackSpy = vi
        .spyOn(implicitFlowCallbackService, 'authenticatedImplicitFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);
      expect(authenticatedImplicitFlowCallbackSpy).not.toHaveBeenCalled();
    });

    it('should call next on refreshSessionWithIFrameCompleted with callbackcontext', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      vi.spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).mockReturnValue(
        of({
          authResult: { id_token: 'test-token', access_token: 'test-access' },
        } as CallbackContext)
      );
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];
      let result: unknown;

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (completed) => (result = completed)
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);

      expect(result).toEqual({
        success: true,
        authResult: { id_token: 'test-token', access_token: 'test-access' },
        configId: 'configId1',
      });
    });

    it('should log and call flowsDataService.resetSilentRenewRunning in case of an error', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      vi.spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).mockReturnValue(throwError(() => new Error('ERROR')));
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const logErrorSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const allConfigs = [{ configId: 'configId1' }];
      const eventData = { detail: 'detail?detail2' } as CustomEvent;

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);
      expect(resetSilentRenewRunningSpy).toHaveBeenCalledTimes(1);
      expect(logErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should call next on refreshSessionWithIFrameCompleted with success false and the error message in case of an error', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      vi.spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).mockReturnValue(throwError(() => new Error('ERROR')));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];
      let result: unknown;

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (completed) => (result = completed)
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);

      expect(result).toEqual({
        success: false,
        configId: 'configId1',
        errorMessage: 'ERROR',
      });
    });

    it('should emit the error of the silent renew callback url on refreshSessionWithIFrameCompleted', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const eventData = {
        detail:
          'https://localhost/silent-renew?error=login_required&state=state',
      } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];
      let result: unknown;

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (completed) => (result = completed)
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);

      expect(result).toEqual({
        success: false,
        configId: 'configId1',
        errorMessage: 'login_required',
      });
    });

    it('should emit the error description of the silent renew callback url on refreshSessionWithIFrameCompleted', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const eventData = {
        detail:
          'https://localhost/silent-renew?error=login_required&error_description=session_expired&state=state',
      } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];
      let result: unknown;

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (completed) => (result = completed)
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);

      expect(result).toEqual({
        success: false,
        configId: 'configId1',
        errorMessage: 'login_required',
        errorDescription: 'session_expired',
      });
    });

    it('should emit a non error rejection as error message on refreshSessionWithIFrameCompleted', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);
      vi.spyOn(
        implicitFlowCallbackService,
        'authenticatedImplicitFlowCallback'
      ).mockReturnValue(throwError(() => 'some error'));
      const eventData = { detail: 'detail' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];
      let result: unknown;

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (completed) => (result = completed)
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);

      expect(result).toEqual({
        success: false,
        configId: 'configId1',
        errorMessage: 'some error',
      });
    });
  });
});
