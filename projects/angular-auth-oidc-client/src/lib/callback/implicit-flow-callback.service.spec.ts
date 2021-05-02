import { TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsDataServiceMock } from '../flows/flows-data.service-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';
import { IntervalService } from './interval.service';

describe('ImplicitFlowCallbackService ', () => {
  let implicitFlowCallbackService: ImplicitFlowCallbackService;
  let intervalService: IntervalService;
  let flowsService: FlowsService;
  let configurationProvider: ConfigurationProvider;
  let flowsDataService: FlowsDataService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        ImplicitFlowCallbackService,
        { provide: FlowsService, useClass: FlowsServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        IntervalService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
      ],
    });
  });

  beforeEach(() => {
    implicitFlowCallbackService = TestBed.inject(ImplicitFlowCallbackService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    intervalService = TestBed.inject(IntervalService);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowsService = TestBed.inject(FlowsService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(implicitFlowCallbackService).toBeTruthy();
  });

  describe('authorizedImplicitFlowCallback', () => {
    it('calls flowsService.processImplicitFlowCallback with has if given', () => {
      const spy = spyOn(flowsService, 'processImplicitFlowCallback').and.returnValue(of(null));
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ triggerAuthorizationResultEvent: true });

      implicitFlowCallbackService.authorizedImplicitFlowCallback('some-hash');

      expect(spy).toHaveBeenCalledWith('some-hash');
    });

    it(
      'does nothing if triggerAuthorizationResultEvent is true and isRenewProcess is true',
      waitForAsync(() => {
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
        const spy = spyOn(flowsService, 'processImplicitFlowCallback').and.returnValue(of(callbackContext));
        const routerSpy = spyOn(router, 'navigateByUrl');
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ triggerAuthorizationResultEvent: true });
        implicitFlowCallbackService.authorizedImplicitFlowCallback('some-hash').subscribe(() => {
          expect(spy).toHaveBeenCalledWith('some-hash');
          expect(routerSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'calls router if triggerAuthorizationResultEvent is false and isRenewProcess is false',
      waitForAsync(() => {
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
        const spy = spyOn(flowsService, 'processImplicitFlowCallback').and.returnValue(of(callbackContext));
        const routerSpy = spyOn(router, 'navigateByUrl');
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          triggerAuthorizationResultEvent: false,
          postLoginRoute: 'postLoginRoute',
        });
        implicitFlowCallbackService.authorizedImplicitFlowCallback('some-hash').subscribe(() => {
          expect(spy).toHaveBeenCalledWith('some-hash');
          expect(routerSpy).toHaveBeenCalledWith('postLoginRoute');
        });
      })
    );

    it(
      'resetSilentRenewRunning and stopPeriodicallyTokenCheck in case of error',
      waitForAsync(() => {
        spyOn(flowsService, 'processImplicitFlowCallback').and.returnValue(throwError('error'));
        const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
        const stopPeriodicallyTokenCheckSpy = spyOn(intervalService, 'stopPeriodicallTokenCheck');

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          triggerAuthorizationResultEvent: false,
          postLoginRoute: 'postLoginRoute',
        });
        implicitFlowCallbackService.authorizedImplicitFlowCallback('some-hash').subscribe({
          error: (err) => {
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
            expect(stopPeriodicallyTokenCheckSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      `navigates to unauthorizedRoute in case of error and  in case of error and
        triggerAuthorizationResultEvent is false`,
      waitForAsync(() => {
        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
        spyOn(flowsService, 'processImplicitFlowCallback').and.returnValue(throwError('error'));
        const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
        const stopPeriodicallTokenCheckSpy = spyOn(intervalService, 'stopPeriodicallTokenCheck');
        const routerSpy = spyOn(router, 'navigateByUrl');

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          triggerAuthorizationResultEvent: false,
          unauthorizedRoute: 'unauthorizedRoute',
        });
        implicitFlowCallbackService.authorizedImplicitFlowCallback('some-hash').subscribe({
          error: (err) => {
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
            expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
            expect(routerSpy).toHaveBeenCalledWith('unauthorizedRoute');
          },
        });
      })
    );
  });
});
