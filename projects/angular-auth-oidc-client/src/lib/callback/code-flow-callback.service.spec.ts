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
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { IntervallService } from './intervall.service';

describe('CodeFlowCallbackService ', () => {
  let codeFlowCallbackService: CodeFlowCallbackService;
  let intervallService: IntervallService;
  let flowsService: FlowsService;
  let configurationProvider: ConfigurationProvider;
  let flowsDataService: FlowsDataService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        CodeFlowCallbackService,
        { provide: FlowsService, useClass: FlowsServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        IntervallService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
      ],
    });
  });

  beforeEach(() => {
    codeFlowCallbackService = TestBed.inject(CodeFlowCallbackService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    intervallService = TestBed.inject(IntervallService);
    flowsDataService = TestBed.inject(FlowsDataService);
    flowsService = TestBed.inject(FlowsService);
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(codeFlowCallbackService).toBeTruthy();
  });

  describe('authorizedCallbackWithCode', () => {
    it('calls flowsService.processCodeFlowCallback with correct url', () => {
      const spy = spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(of(null));
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ triggerAuthorizationResultEvent: true });

      codeFlowCallbackService.authorizedCallbackWithCode('some-url1');
      expect(spy).toHaveBeenCalledWith('some-url1');
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
        const spy = spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(of(callbackContext));
        const routerSpy = spyOn(router, 'navigateByUrl');
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ triggerAuthorizationResultEvent: true });
        codeFlowCallbackService.authorizedCallbackWithCode('some-url2').subscribe(() => {
          expect(spy).toHaveBeenCalledWith('some-url2');
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
        const spy = spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(of(callbackContext));
        const routerSpy = spyOn(router, 'navigateByUrl');
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          triggerAuthorizationResultEvent: false,
          postLoginRoute: 'postLoginRoute',
        });
        codeFlowCallbackService.authorizedCallbackWithCode('some-url3').subscribe(() => {
          expect(spy).toHaveBeenCalledWith('some-url3');
          expect(routerSpy).toHaveBeenCalledWith('postLoginRoute');
        });
      })
    );

    it(
      'resetSilentRenewRunning and stopPeriodicallTokenCheck in case of error',
      waitForAsync(() => {
        spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(throwError('error'));
        const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
        const stopPeriodicallTokenCheckSpy = spyOn(intervallService, 'stopPeriodicallTokenCheck');

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          triggerAuthorizationResultEvent: false,
          postLoginRoute: 'postLoginRoute',
        });
        codeFlowCallbackService.authorizedCallbackWithCode('some-url4').subscribe({
          error: (err) => {
            expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
            expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
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
        spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(throwError('error'));
        const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
        const stopPeriodicallTokenCheckSpy = spyOn(intervallService, 'stopPeriodicallTokenCheck');
        const routerSpy = spyOn(router, 'navigateByUrl');

        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          triggerAuthorizationResultEvent: false,
          unauthorizedRoute: 'unauthorizedRoute',
        });
        codeFlowCallbackService.authorizedCallbackWithCode('some-url5').subscribe({
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
