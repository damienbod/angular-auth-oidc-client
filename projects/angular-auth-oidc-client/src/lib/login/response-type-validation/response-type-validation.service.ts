import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { FlowHelper } from '../../utils/flowHelper/flow-helper.service';

@Injectable()
export class ResponseTypeValidationService {
  constructor(private loggerService: LoggerService, private flowHelper: FlowHelper) {}

  hasConfigValidResponseType(configuration: OpenIdConfiguration): boolean {
    if (this.flowHelper.isCurrentFlowAnyImplicitFlow(configuration)) {
      return true;
    }

    if (this.flowHelper.isCurrentFlowCodeFlow(configuration)) {
      return true;
    }

    const { configId } = configuration;
    this.loggerService.logWarning(configId, 'module configured incorrectly, invalid response_type. Check the responseType in the config');

    return false;
  }
}
