import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';
import { IntervalService } from './interval.service';

describe('ImplicitFlowCallbackService ', () => {
  let implicitFlowCallbackService: ImplicitFlowCallbackService;
  let intervalService: IntervalService;
  let flowsService: FlowsService;
  let flowsDataService: FlowsDataService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        mockProvider(FlowsService),
        mockProvider(FlowsDataService),
        mockProvider(IntervalService),
      ],
    });
  });

  beforeEach(() => {
    implicitFlowCallbackService = TestBed.inject(ImplicitFlowCallbackService);
    intervalService = TestBed.inject(IntervalService);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowsService = TestBed.inject(FlowsService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(implicitFlowCallbackService).toBeTruthy();
  });

  describe('authorizedImplicitFlowCallback', () => {
    it('calls flowsService.processImplicitFlowCallback with hash if given', () => {
      const spy = vi
        .spyOn(flowsService, 'processImplicitFlowCallback')
        .mockReturnValue(of({} as CallbackContext));
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      implicitFlowCallbackService.authenticatedImplicitFlowCallback(
        config,
        [config],
        'some-hash'
      );

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(config, [config], 'some-hash');
    });

    it('does nothing if triggerAuthorizationResultEvent is true and isRenewProcess is true', waitForAsync(() => {
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
        .spyOn(flowsService, 'processImplicitFlowCallback')
        .mockReturnValue(of(callbackContext));
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      implicitFlowCallbackService
        .authenticatedImplicitFlowCallback(config, [config], 'some-hash')
        .subscribe(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(config, [config], 'some-hash');
          expect(routerSpy).not.toHaveBeenCalled();
        });
    }));

    it('calls router if triggerAuthorizationResultEvent is false and isRenewProcess is false', waitForAsync(() => {
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
        .spyOn(flowsService, 'processImplicitFlowCallback')
        .mockReturnValue(of(callbackContext));
      const routerSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockReturnValue(undefined as any);
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        postLoginRoute: 'postLoginRoute',
      };

      implicitFlowCallbackService
        .authenticatedImplicitFlowCallback(config, [config], 'some-hash')
        .subscribe(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(config, [config], 'some-hash');
          expect(routerSpy).toHaveBeenCalledTimes(1);
          expect(routerSpy).toHaveBeenCalledWith('postLoginRoute');
        });
    }));

    it('resetSilentRenewRunning and stopPeriodicallyTokenCheck in case of error', waitForAsync(() => {
      vi.spyOn(flowsService, 'processImplicitFlowCallback').mockReturnValue(
        throwError(() => new Error('error'))
      );
      const resetSilentRenewRunningSpy = vi
        .spyOn(flowsDataService, 'resetSilentRenewRunning')
        .mockReturnValue(undefined);
      const stopPeriodicallyTokenCheckSpy = vi
        .spyOn(intervalService, 'stopPeriodicTokenCheck')
        .mockReturnValue(undefined);
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        postLoginRoute: 'postLoginRoute',
      };

      implicitFlowCallbackService
        .authenticatedImplicitFlowCallback(config, [config], 'some-hash')
        .subscribe({
          error: (err) => {
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
            expect(stopPeriodicallyTokenCheckSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
    }));

    it(`navigates to unauthorizedRoute in case of error and  in case of error and
        triggerAuthorizationResultEvent is false`, waitForAsync(() => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      vi.spyOn(flowsService, 'processImplicitFlowCallback').mockReturnValue(
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

      implicitFlowCallbackService
        .authenticatedImplicitFlowCallback(config, [config], 'some-hash')
        .subscribe({
          error: (err) => {
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
            expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
            expect(routerSpy).toHaveBeenCalledTimes(1);
            expect(routerSpy).toHaveBeenCalledWith('unauthorizedRoute');
          },
        });
    }));
  });
});
