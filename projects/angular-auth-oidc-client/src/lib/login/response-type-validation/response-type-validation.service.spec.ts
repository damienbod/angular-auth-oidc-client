/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { FlowHelper } from '../../utils/flowHelper/flow-helper.service';
import { FlowHelperMock } from '../../utils/flowHelper/flow-helper.service.mock';
import { ResponseTypeValidationService } from './response-type-validation.service';

describe('ResponseTypeValidationService', () => {
  let responseTypeValidationService: ResponseTypeValidationService;
  let flowHelper: FlowHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ResponseTypeValidationService,
        {
          provide: LoggerService,
          useClass: LoggerServiceMock,
        },
        {
          provide: FlowHelper,
          useClass: FlowHelperMock,
        },
      ],
    });
  });

  beforeEach(() => {
    responseTypeValidationService = TestBed.inject(ResponseTypeValidationService);
    flowHelper = TestBed.inject(FlowHelper);
  });

  it('should create', () => {
    expect(responseTypeValidationService).toBeTruthy();
  });

  describe('hasConfigValidResponseType', () => {
    it('returns true if current configured flow is any implicit flow', () => {
      spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(true);

      const result = responseTypeValidationService.hasConfigValidResponseType();
      expect(result).toEqual(true);
    });

    it('returns true if current configured flow is code flow', () => {
      spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(false);
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);

      const result = responseTypeValidationService.hasConfigValidResponseType();
      expect(result).toEqual(true);
    });

    it('returns false if current configured flow is neither code nor implicit flow', () => {
      spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(false);
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);

      const result = responseTypeValidationService.hasConfigValidResponseType();
      expect(result).toEqual(false);
    });
  });
});
