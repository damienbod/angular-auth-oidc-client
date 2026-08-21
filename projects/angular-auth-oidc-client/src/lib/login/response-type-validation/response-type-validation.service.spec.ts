import { TestBed } from '@angular/core/testing';
import { mockProvider } from '../../../test/auto-mock';
import { LoggerService } from '../../logging/logger.service';
import { FlowHelper } from '../../utils/flowHelper/flow-helper.service';
import { ResponseTypeValidationService } from './response-type-validation.service';

describe('ResponseTypeValidationService', () => {
  let responseTypeValidationService: ResponseTypeValidationService;
  let flowHelper: FlowHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        ResponseTypeValidationService,
        mockProvider(LoggerService),
        mockProvider(FlowHelper),
      ],
    });
  });

  beforeEach(() => {
    responseTypeValidationService = TestBed.inject(
      ResponseTypeValidationService
    );
    flowHelper = TestBed.inject(FlowHelper);
  });

  it('should create', () => {
    expect(responseTypeValidationService).toBeTruthy();
  });

  describe('hasConfigValidResponseType', () => {
    it('returns true if current configured flow is any implicit flow', () => {
      vi.spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').mockReturnValue(
        true
      );

      const result = responseTypeValidationService.hasConfigValidResponseType({
        configId: 'configId1',
      });

      expect(result).toEqual(true);
    });

    it('returns true if current configured flow is code flow', () => {
      vi.spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').mockReturnValue(
        false
      );
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);

      const result = responseTypeValidationService.hasConfigValidResponseType({
        configId: 'configId1',
      });

      expect(result).toEqual(true);
    });

    it('returns false if current configured flow is neither code nor implicit flow', () => {
      vi.spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').mockReturnValue(
        false
      );
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);

      const result = responseTypeValidationService.hasConfigValidResponseType({
        configId: 'configId1',
      });

      expect(result).toEqual(false);
    });
  });
});
