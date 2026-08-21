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
import { LoggerService } from '../logging/logger.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { ValidationResult } from '../validation/validation-result';
import { IFrameService } from './existing-iframe.service';
import { SilentRenewService } from './silent-renew.service';

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
    it('is of type observable', () => {
      expect(silentRenewService.refreshSessionWithIFrameCompleted$).toEqual(
        expect.any(Observable)
      );
    });
  });

  describe('isSilentRenewConfigured', () => {
    it('returns true if refreshToken is configured false and silentRenew is configured true', () => {
      const config = { useRefreshToken: false, silentRenew: true };
      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(true);
    });

    it('returns false if refreshToken is configured true and silentRenew is configured true', () => {
      const config = { useRefreshToken: true, silentRenew: true };
      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(false);
    });

    it('returns false if refreshToken is configured false and silentRenew is configured false', () => {
      const config = { useRefreshToken: false, silentRenew: false };
      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(false);
    });
  });

  describe('getOrCreateIframe', () => {
    it('returns iframe if iframe is truthy', () => {
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

    it('adds iframe to body if existing iframe is falsy', () => {
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

  describe('codeFlowCallbackSilentRenewIframe', () => {
    it('calls processSilentRenewCodeFlowCallback with correct arguments', async () => {
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

    it('throws error if url has error param and resets everything on error', async () => {
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
  });

  describe('silentRenewEventHandler', () => {
    it('returns if no details is given', async () => {
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

    it('calls authorizedImplicitFlowCallback if current flow is not code flow', async () => {
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

    it('calls codeFlowCallbackSilentRenewIframe if current flow is code flow', async () => {
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

    it('calls authorizedImplicitFlowCallback if current flow is not code flow', async () => {
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

    it('calls next on refreshSessionWithIFrameCompleted with callbackcontext', async () => {
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

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (result) => {
          expect(result).toEqual({
            success: true,
            authResult: { id_token: 'test-token', access_token: 'test-access' },
            configId: 'configId1',
          });
        }
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);
    });

    it('loggs and calls flowsDataService.resetSilentRenewRunning in case of an error', async () => {
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

    it('calls next on refreshSessionWithIFrameCompleted with null in case of error', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      vi.spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).mockReturnValue(throwError(() => new Error('ERROR')));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (result) => {
          expect(result).toEqual({ success: false, configId: 'configId1' });
        }
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      await vi.advanceTimersByTimeAsync(1000);
    });
  });
});
