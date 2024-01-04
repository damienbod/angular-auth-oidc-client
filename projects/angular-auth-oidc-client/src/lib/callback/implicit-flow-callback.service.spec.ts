import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
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
        ImplicitFlowCallbackService,
        { provide: FlowsService, useClass: mockClass(FlowsService) },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
        IntervalService,
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
      const spy = spyOn(
        flowsService,
        'processImplicitFlowCallback'
      ).and.returnValue(of({} as CallbackContext));
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      implicitFlowCallbackService.authenticatedImplicitFlowCallback(
        config,
        [config],
        'some-hash'
      );

      expect(spy).toHaveBeenCalledOnceWith(config, [config], 'some-hash');
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
      const spy = spyOn(
        flowsService,
        'processImplicitFlowCallback'
      ).and.returnValue(of(callbackContext));
      const routerSpy = spyOn(router, 'navigateByUrl');
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      implicitFlowCallbackService
        .authenticatedImplicitFlowCallback(config, [config], 'some-hash')
        .subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith(config, [config], 'some-hash');
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
      const spy = spyOn(
        flowsService,
        'processImplicitFlowCallback'
      ).and.returnValue(of(callbackContext));
      const routerSpy = spyOn(router, 'navigateByUrl');
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        postLoginRoute: 'postLoginRoute',
      };

      implicitFlowCallbackService
        .authenticatedImplicitFlowCallback(config, [config], 'some-hash')
        .subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith(config, [config], 'some-hash');
          expect(routerSpy).toHaveBeenCalledOnceWith('postLoginRoute');
        });
    }));

    it('resetSilentRenewRunning and stopPeriodicallyTokenCheck in case of error', waitForAsync(() => {
      spyOn(flowsService, 'processImplicitFlowCallback').and.returnValue(
        throwError(() => new Error('error'))
      );
      const resetSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );
      const stopPeriodicallyTokenCheckSpy = spyOn(
        intervalService,
        'stopPeriodicTokenCheck'
      );
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
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(flowsService, 'processImplicitFlowCallback').and.returnValue(
        throwError(() => new Error('error'))
      );
      const resetSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );
      const stopPeriodicallTokenCheckSpy = spyOn(
        intervalService,
        'stopPeriodicTokenCheck'
      );
      const routerSpy = spyOn(router, 'navigateByUrl');
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
            expect(routerSpy).toHaveBeenCalledOnceWith('unauthorizedRoute');
          },
        });
    }));
  });
});
