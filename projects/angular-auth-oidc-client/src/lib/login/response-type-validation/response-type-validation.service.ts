import { Injectable } from '@angular/core';
import { LoggerService } from '../../logging/logger.service';
import { FlowHelper } from '../../utils/flowHelper/flow-helper.service';

@Injectable()
export class ResponseTypeValidationService {
  constructor(private loggerService: LoggerService, private flowHelper: FlowHelper) {}

  hasConfigValidResponseType(): boolean {
    if (this.flowHelper.isCurrentFlowAnyImplicitFlow()) {
      return true;
    }

    if (this.flowHelper.isCurrentFlowCodeFlow()) {
      return true;
    }

    this.loggerService.logWarning('module configured incorrectly, invalid response_type. Check the responseType in the config');
    return false;
  }
}
