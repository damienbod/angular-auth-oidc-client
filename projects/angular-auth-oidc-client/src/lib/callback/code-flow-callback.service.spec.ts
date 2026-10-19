import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { IntervalService } from './interval.service';

describe('CodeFlowCallbackService ', () => {
  let codeFlowCallbackService: CodeFlowCallbackService;
  let intervalService: IntervalService;
  let flowsService: FlowsService;
  let flowsDataService: FlowsDataService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        CodeFlowCallbackService,
        mockProvider(FlowsService),
        mockProvider(FlowsDataService),
        mockProvider(IntervalService),
      ],
    });
  });

  beforeEach(() => {
    codeFlowCallbackService = TestBed.inject(CodeFlowCallbackService);
    intervalService = TestBed.inject(IntervalService);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowsService = TestBed.inject(FlowsService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(codeFlowCallbackService).toBeTruthy();
  });

  describe('authenticatedCallbackWithCode', () => {
    it('should call flowsService.processCodeFlowCallback with correct url', () => {
      const spy = vi
        .spyOn(flowsService, 'processCodeFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      //spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ triggerAuthorizationResultEvent: true });
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      codeFlowCallbackService.authenticatedCallbackWithCode(
        'some-url1',
        config,
        [config]
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('some-url1', config, [config]);
    });

    it('should only call resetCodeFlowInProgress if triggerAuthorizationResultEvent is true and isRenewProcess is true', async () => {
      const callbackContext = {
        code: '',
        refreshToken: '',
        state: '',
        sessionState: null,
        authResult: null,
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: '',
      };
      const spy = vi
        .spyOn(flowsService, 'processCodeFlowCallback')
        .mockReturnValue(of(callbackContext));
      const flowsDataSpy = vi
        .spyOn(flowsDataService, 'resetCodeFlowInProgress')
        .mockReturnValue(undefined);
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      await firstValueFrom(
        codeFlowCallbackService.authenticatedCallbackWithCode(
          'some-url2',
          config,
          [config]
        )
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('some-url2', config, [config]);
      expect(routerSpy).not.toHaveBeenCalled();
      expect(flowsDataSpy).toHaveBeenCalled();
    });

    it('should call router and resetCodeFlowInProgress if triggerAuthorizationResultEvent is false and isRenewProcess is false', async () => {
      const callbackContext = {
        code: '',
        refreshToken: '',
        state: '',
        sessionState: null,
        authResult: null,
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: '',
      };
      const spy = vi
        .spyOn(flowsService, 'processCodeFlowCallback')
        .mockReturnValue(of(callbackContext));
      const flowsDataSpy = vi
        .spyOn(flowsDataService, 'resetCodeFlowInProgress')
        .mockReturnValue(undefined);
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        postLoginRoute: 'postLoginRoute',
      };

      await firstValueFrom(
        codeFlowCallbackService.authenticatedCallbackWithCode(
          'some-url3',
          config,
          [config]
        )
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('some-url3', config, [config]);
      expect(routerSpy).toHaveBeenCalledTimes(1);
      expect(routerSpy).toHaveBeenCalledWith('postLoginRoute');
      expect(flowsDataSpy).toHaveBeenCalled();
    });

    it('should reset silent renew, reset code flow in progress and stop the periodic token check in case of error', async () => {
      vi.spyOn(flowsService, 'processCodeFlowCallback').mockReturnValue(
        throwError(() => new Error('error'))
      );
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const resetCodeFlowInProgressSpy = vi
        .spyOn(flowsDataService, 'resetCodeFlowInProgress')
        .mockReturnValue(undefined);
      const stopPeriodicallTokenCheckSpy = vi
        .spyOn(intervalService, 'stopPeriodicTokenCheck')
        .mockReturnValue(undefined);
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        postLoginRoute: 'postLoginRoute',
      };

      await expect(
        firstValueFrom(
          codeFlowCallbackService.authenticatedCallbackWithCode(
            'some-url4',
            config,
            [config]
          )
        )
      ).rejects.toThrow('error');
      expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
      expect(resetCodeFlowInProgressSpy).toHaveBeenCalled();
      expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
    });

    it(`should navigate to unauthorizedRoute in case of error and  in case of error and
            triggerAuthorizationResultEvent is false`, async () => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(flowsService, 'processCodeFlowCallback').mockReturnValue(
        throwError(() => new Error('error'))
      );
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const stopPeriodicallTokenCheckSpy = vi
        .spyOn(intervalService, 'stopPeriodicTokenCheck')
        .mockReturnValue(undefined);
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        unauthorizedRoute: 'unauthorizedRoute',
      };

      await expect(
        firstValueFrom(
          codeFlowCallbackService.authenticatedCallbackWithCode(
            'some-url5',
            config,
            [config]
          )
        )
      ).rejects.toThrow('error');
      expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
      expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
      expect(routerSpy).toHaveBeenCalledTimes(1);
      expect(routerSpy).toHaveBeenCalledWith('unauthorizedRoute');
    });

    it('should pass the original error on to the subscriber unchanged', async () => {
      // Arrange
      const callbackError = new Error('state mismatch');
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      vi.spyOn(flowsService, 'processCodeFlowCallback').mockReturnValue(
        throwError(() => callbackError)
      );

      // Act & Assert
      await expect(
        firstValueFrom(
          codeFlowCallbackService.authenticatedCallbackWithCode(
            'some-url6',
            config,
            [config]
          )
        )
      ).rejects.toBe(callbackError);
    });
  });
});
