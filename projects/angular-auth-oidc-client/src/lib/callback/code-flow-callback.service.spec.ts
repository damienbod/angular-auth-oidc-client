import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
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
        { provide: FlowsService, useClass: mockClass(FlowsService) },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
        IntervalService,
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
    it('calls flowsService.processCodeFlowCallback with correct url', () => {
      const spy = spyOn(
        flowsService,
        'processCodeFlowCallback'
      ).and.returnValue(of(null));
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
      expect(spy).toHaveBeenCalledOnceWith('some-url1', config, [config]);
    });

    it('does only call resetCodeFlowInProgress if triggerAuthorizationResultEvent is true and isRenewProcess is true', waitForAsync(() => {
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
        'processCodeFlowCallback'
      ).and.returnValue(of(callbackContext));
      const flowsDataSpy = spyOn(flowsDataService, 'resetCodeFlowInProgress');
      const routerSpy = spyOn(router, 'navigateByUrl');
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: true,
      };

      codeFlowCallbackService
        .authenticatedCallbackWithCode('some-url2', config, [config])
        .subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('some-url2', config, [config]);
          expect(routerSpy).not.toHaveBeenCalled();
          expect(flowsDataSpy).toHaveBeenCalled();
        });
    }));

    it('calls router and resetCodeFlowInProgress if triggerAuthorizationResultEvent is false and isRenewProcess is false', waitForAsync(() => {
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
        'processCodeFlowCallback'
      ).and.returnValue(of(callbackContext));
      const flowsDataSpy = spyOn(flowsDataService, 'resetCodeFlowInProgress');
      const routerSpy = spyOn(router, 'navigateByUrl');
      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        postLoginRoute: 'postLoginRoute',
      };

      codeFlowCallbackService
        .authenticatedCallbackWithCode('some-url3', config, [config])
        .subscribe(() => {
          expect(spy).toHaveBeenCalledOnceWith('some-url3', config, [config]);
          expect(routerSpy).toHaveBeenCalledOnceWith('postLoginRoute');
          expect(flowsDataSpy).toHaveBeenCalled();
        });
    }));

    it('resetSilentRenewRunning, resetCodeFlowInProgress and stopPeriodicallTokenCheck in case of error', waitForAsync(() => {
      spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(
        throwError(() => new Error('error'))
      );
      const resetSilentRenewRunningSpy = spyOn(
        flowsDataService,
        'resetSilentRenewRunning'
      );
      const resetCodeFlowInProgressSpy = spyOn(
        flowsDataService,
        'resetCodeFlowInProgress'
      );
      const stopPeriodicallTokenCheckSpy = spyOn(
        intervalService,
        'stopPeriodicTokenCheck'
      );

      const config = {
        configId: 'configId1',
        triggerAuthorizationResultEvent: false,
        postLoginRoute: 'postLoginRoute',
      };

      codeFlowCallbackService
        .authenticatedCallbackWithCode('some-url4', config, [config])
        .subscribe({
          error: (err) => {
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
            expect(resetCodeFlowInProgressSpy).toHaveBeenCalled();
            expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
    }));

    it(`navigates to unauthorizedRoute in case of error and  in case of error and
            triggerAuthorizationResultEvent is false`, waitForAsync(() => {
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
      spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(
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

      codeFlowCallbackService
        .authenticatedCallbackWithCode('some-url5', config, [config])
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
