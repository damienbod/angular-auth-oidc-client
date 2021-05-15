import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { Level, RuleValidationResult } from './rule';
import { allMultipleConfigRules, allRules } from './rules';

@Injectable()
export class ConfigValidationService {
  constructor(private loggerService: LoggerService) {}

  validateConfigs(passedConfigs: [OpenIdConfiguration]): boolean {
    const allValidationResults = allMultipleConfigRules.map((rule) => rule(passedConfigs));

    const errorCount = this.processValidationResultsAndGetErrorCount(allValidationResults);

    return errorCount === 0;
  }

  validateConfig(passedConfig: OpenIdConfiguration): boolean {
    const allValidationResults = allRules.map((rule) => rule(passedConfig));

    const errorCount = this.processValidationResultsAndGetErrorCount(allValidationResults);

    return errorCount === 0;
  }

  private processValidationResultsAndGetErrorCount(allValidationResults: RuleValidationResult[]) {
    const allMessages = allValidationResults.filter((x) => x.messages.length > 0);

    const allErrorMessages = this.getAllMessagesOfType('error', allMessages);
    const allWarnings = this.getAllMessagesOfType('warning', allMessages);
    allErrorMessages.forEach((message) => this.loggerService.logErrorGeneral(message));
    allWarnings.forEach((message) => this.loggerService.logWarningGeneral(message));

    return allErrorMessages.length;
  }

  private getAllMessagesOfType(type: Level, results: RuleValidationResult[]) {
    const allMessages = results.filter((x) => x.level === type).map((result) => result.messages);
    return allMessages.reduce((acc, val) => acc.concat(val), []);
  }
}
