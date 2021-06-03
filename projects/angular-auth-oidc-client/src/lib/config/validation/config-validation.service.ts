import { Injectable } from '@angular/core';
import { LoggerService } from '../../logging/logger.service';
import { OpenIdConfiguration } from '../openid-configuration';
import { Level, RuleValidationResult } from './rule';
import { allRules } from './rules';
import { allMultipleConfigRules } from './rules/index';

@Injectable()
export class ConfigValidationService {
  constructor(private loggerService: LoggerService) {}

  validateConfigs(passedConfigs: OpenIdConfiguration[]): boolean {
    return this.validateConfigsInternal(passedConfigs, allMultipleConfigRules);
  }

  validateConfig(passedConfig: OpenIdConfiguration): boolean {
    return this.validateConfigInternal(passedConfig, allRules);
  }

  private validateConfigsInternal(passedConfigs: OpenIdConfiguration[], allRulesToUse: any[]): boolean {
    const allValidationResults = allRulesToUse.map((rule) => rule(passedConfigs));

    let overallErrorCount = 0;
    passedConfigs.forEach((passedConfig) => {
      const errorCount = this.processValidationResultsAndGetErrorCount(allValidationResults, passedConfig.configId);
      overallErrorCount += errorCount;
    });

    return overallErrorCount === 0;
  }

  private validateConfigInternal(passedConfig: OpenIdConfiguration, allRulesToUse: any[]): boolean {
    const allValidationResults = allRulesToUse.map((rule) => rule(passedConfig));

    const errorCount = this.processValidationResultsAndGetErrorCount(allValidationResults, passedConfig.configId);

    return errorCount === 0;
  }

  private processValidationResultsAndGetErrorCount(allValidationResults: RuleValidationResult[], configId: string) {
    const allMessages = allValidationResults.filter((x) => x.messages.length > 0);

    const allErrorMessages = this.getAllMessagesOfType('error', allMessages);
    const allWarnings = this.getAllMessagesOfType('warning', allMessages);
    allErrorMessages.forEach((message) => this.loggerService.logError(configId, message));
    allWarnings.forEach((message) => this.loggerService.logWarning(configId, message));

    return allErrorMessages.length;
  }

  private getAllMessagesOfType(type: Level, results: RuleValidationResult[]) {
    const allMessages = results.filter((x) => x.level === type).map((result) => result.messages);
    return allMessages.reduce((acc, val) => acc.concat(val), []);
  }
}
