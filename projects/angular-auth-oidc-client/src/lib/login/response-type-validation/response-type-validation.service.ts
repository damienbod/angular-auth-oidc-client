import { Injectable } from '@angular/core';
import { LoggerService } from '../../logging/logger.service';
import { FlowHelper } from '../../utils/flowHelper/flow-helper.service';

@Injectable()
export class ResponseTypeValidationService {
  constructor(private loggerService: LoggerService, private flowHelper: FlowHelper) {}

  hasConfigValidResponseType(configId: string): boolean {
    if (this.flowHelper.isCurrentFlowAnyImplicitFlow(configId)) {
      return true;
    }

    if (this.flowHelper.isCurrentFlowCodeFlow(configId)) {
      return true;
    }

    this.loggerService.logWarning(configId, 'module configured incorrectly, invalid response_type. Check the responseType in the config');
    return false;
  }
}
