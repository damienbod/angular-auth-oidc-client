import { inject, Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { FlowHelper } from '../../utils/flowHelper/flow-helper.service';

@Injectable({ providedIn: 'root' })
export class ResponseTypeValidationService {
  private readonly loggerService = inject(LoggerService);
  private readonly flowHelper = inject(FlowHelper);

  hasConfigValidResponseType(configuration: OpenIdConfiguration): boolean {
    if (this.flowHelper.isCurrentFlowAnyImplicitFlow(configuration)) {
      return true;
    }

    if (this.flowHelper.isCurrentFlowCodeFlow(configuration)) {
      return true;
    }

    this.loggerService.logWarning(
      configuration,
      'module configured incorrectly, invalid response_type. Check the responseType in the config'
    );

    return false;
  }
}
