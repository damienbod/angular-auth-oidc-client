import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
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
        jasmine.any(Observable)
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
      const config = { useRefreshToken: true, silentRenew: true };      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(false);
    });

    it('returns false if refreshToken is configured false and silentRenew is configured false', () => {
      const config = { useRefreshToken: false, silentRenew: false };      const result = silentRenewService.isSilentRenewConfigured(config);

      expect(result).toBe(false);
    });
  });

  describe('getOrCreateIframe', () => {
    it('returns iframe if iframe is truthy', () => {
      const config = { configId: 'configId1' };
      const mockIframe = { name: 'anything' } as HTMLIFrameElement;
      
      spyOn(iFrameService, 'getExistingIFrame').and.returnValue(mockIframe);

      const result = silentRenewService.getOrCreateIframe(config);

      expect(result).toEqual(mockIframe);
      expect(iFrameService.getExistingIFrame).toHaveBeenCalledOnceWith('myiFrameForSilentRenew_configId1');
    });

    it('adds iframe to body if existing iframe is falsy', () => {
      const config = { configId: 'configId1' };

      spyOn(iFrameService, 'getExistingIFrame').and.returnValue(null);

      const spy = spyOn(iFrameService, 'addIFrameToWindowBody').and.returnValue(
        { name: 'anything' } as HTMLIFrameElement
      );      const result = silentRenewService.getOrCreateIframe(config);

      expect(result).toEqual({ name: 'anything' } as HTMLIFrameElement);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledOnceWith('myiFrameForSilentRenew_configId1', config);
    });
  });

  describe('codeFlowCallbackSilentRenewIframe', () => {
    it('calls processSilentRenewCodeFlowCallback with correct arguments', waitForAsync(() => {
      const config = { configId: 'configId1' };
      const allConfigs = [config];      const spy = spyOn(
        flowsService,
        'processSilentRenewCodeFlowCallback'
      ).and.returnValue(of({} as CallbackContext));
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

      silentRenewService
        .codeFlowCallbackSilentRenewIframe([url, urlParts], config, allConfigs)
        .subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith(
            expectedContext,
            config,
            allConfigs
          );
        });
    }));

    it('throws error if url has error param and resets everything on error', waitForAsync(() => {
      const config = { configId: 'configId1' };
      const allConfigs = [config];      const spy = spyOn(
        flowsService,
        'processSilentRenewCodeFlowCallback'
      ).and.returnValue(of({} as CallbackContext));
      const authStateServiceSpy = spyOn(
        authStateService,
        'updateAndPublishAuthState'
      );
      const resetAuthorizationDataSpy = spyOn(
        resetAuthDataService,
        'resetAuthorizationData'
      );
      const setNonceSpy = spyOn(flowsDataService, 'setNonce');
      const stopPeriodicTokenCheckSpy = spyOn(
        intervalService,
        'stopPeriodicTokenCheck'
      );      const url = 'url-part-1';
      const urlParts = 'error=some_error';

      silentRenewService
        .codeFlowCallbackSilentRenewIframe([url, urlParts], config, allConfigs)
        .subscribe({
          error: (error) => {
            expect(error).toEqual(new Error('some_error'));
            expect(spy).not.toHaveBeenCalled();
            expect(authStateServiceSpy).toHaveBeenCalledOnceWith({
              isAuthenticated: false,
              validationResult: ValidationResult.LoginRequired,
              isRenewProcess: true,
            });
            expect(resetAuthorizationDataSpy).toHaveBeenCalledOnceWith(
              config,
              allConfigs
            );
            expect(setNonceSpy).toHaveBeenCalledOnceWith('', config);
            expect(stopPeriodicTokenCheckSpy).toHaveBeenCalledTimes(1);
          },
        });
    }));
  });

  describe('silentRenewEventHandler', () => {
    it('returns if no details is given', fakeAsync(() => {
      const isCurrentFlowCodeFlowSpy = spyOn(
        flowHelper,
        'isCurrentFlowCodeFlow'
      ).and.returnValue(false);

      spyOn(
        implicitFlowCallbackService,
        'authenticatedImplicitFlowCallback'
      ).and.returnValue(of({} as CallbackContext));
      const eventData = { detail: null } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      tick(1000);
      expect(isCurrentFlowCodeFlowSpy).not.toHaveBeenCalled();
    }));

    it('calls authorizedImplicitFlowCallback if current flow is not code flow', fakeAsync(() => {
      const isCurrentFlowCodeFlowSpy = spyOn(
        flowHelper,
        'isCurrentFlowCodeFlow'
      ).and.returnValue(false);
      const authorizedImplicitFlowCallbackSpy = spyOn(
        implicitFlowCallbackService,
        'authenticatedImplicitFlowCallback'
      ).and.returnValue(of({} as CallbackContext));
      const eventData = { detail: 'detail' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      tick(1000);
      expect(isCurrentFlowCodeFlowSpy).toHaveBeenCalled();
      expect(authorizedImplicitFlowCallbackSpy).toHaveBeenCalledOnceWith(
        allConfigs[0],
        allConfigs,
        'detail'
      );
    }));

    it('calls codeFlowCallbackSilentRenewIframe if current flow is code flow', fakeAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      const codeFlowCallbackSilentRenewIframe = spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).and.returnValue(of({} as CallbackContext));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      tick(1000);
      expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledOnceWith(
        ['detail', 'detail2'],
        allConfigs[0],
        allConfigs
      );
    }));

    it('calls authorizedImplicitFlowCallback if current flow is not code flow', fakeAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      const codeFlowCallbackSilentRenewIframe = spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).and.returnValue(of({} as CallbackContext));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      tick(1000);
      expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledOnceWith(
        ['detail', 'detail2'],
        allConfigs[0],
        allConfigs
      );
    }));

    it('calls next on refreshSessionWithIFrameCompleted with callbackcontext', fakeAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).and.returnValue(
        of({ refreshToken: 'callbackContext' } as CallbackContext)
      );
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (result) => {
          expect(result).toEqual({
            refreshToken: 'callbackContext',
          } as CallbackContext);
        }
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      tick(1000);
    }));

    it('loggs and calls flowsDataService.resetSilentRenewRunning in case of an error', fakeAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).and.returnValue(throwError(() => new Error('ERROR')));
      const resetSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );
      const logErrorSpy = spyOn(loggerService, 'logError');
      const allConfigs = [{ configId: 'configId1' }];
      const eventData = { detail: 'detail?detail2' } as CustomEvent;

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      tick(1000);
      expect(resetSilentRenewRunningSpy).toHaveBeenCalledTimes(1);
      expect(logErrorSpy).toHaveBeenCalledTimes(1);
    }));

    it('calls next on refreshSessionWithIFrameCompleted with null in case of error', fakeAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      spyOn(
        silentRenewService,
        'codeFlowCallbackSilentRenewIframe'
      ).and.returnValue(throwError(() => new Error('ERROR')));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;
      const allConfigs = [{ configId: 'configId1' }];

      silentRenewService.refreshSessionWithIFrameCompleted$.subscribe(
        (result) => {
          expect(result).toBeNull();
        }
      );

      silentRenewService.silentRenewEventHandler(
        eventData,
        allConfigs[0],
        allConfigs
      );
      tick(1000);
    }));
  });
});
