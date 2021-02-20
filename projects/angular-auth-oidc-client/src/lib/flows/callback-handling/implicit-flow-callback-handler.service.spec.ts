import { TestBed, waitForAsync } from '@angular/core/testing';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { FlowsDataService } from '../flows-data.service';
import { FlowsDataServiceMock } from '../flows-data.service-mock';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../reset-auth-data.service-mock';
import { ImplicitFlowCallbackHandlerService } from './implicit-flow-callback-handler.service';

describe('ImplicitFlowCallbackHandlerService', () => {
  let service: ImplicitFlowCallbackHandlerService;
  let flowsDataService: FlowsDataService;
  let resetAuthDataService: ResetAuthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ImplicitFlowCallbackHandlerService,
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ImplicitFlowCallbackHandlerService);
    flowsDataService = TestBed.inject(FlowsDataService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('implicitFlowCallback', () => {
    it(
      'calls "resetAuthorizationData" if silent renew is not running',
      waitForAsync(() => {
        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
        const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');

        (service as any).implicitFlowCallback('any-hash').subscribe(() => {
          expect(resetAuthorizationDataSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'does NOT calls "resetAuthorizationData" if silent renew is running',
      waitForAsync(() => {
        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
        const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');

        (service as any).implicitFlowCallback('any-hash').subscribe(() => {
          expect(resetAuthorizationDataSpy).not.toHaveBeenCalled();
        });
      })
    );

    it(
      'returns callbackContext if all params are good',
      waitForAsync(() => {
        spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);
        const expectedCallbackContext = {
          code: null,
          refreshToken: null,
          state: null,
          sessionState: null,
          authResult: { anyHash: '' },
          isRenewProcess: true,
          jwtKeys: null,
          validationResult: null,
          existingIdToken: null,
        };
        (service as any).implicitFlowCallback('anyHash').subscribe((callbackContext) => {
          expect(callbackContext).toEqual(expectedCallbackContext);
        });
      })
    );
  });
});
