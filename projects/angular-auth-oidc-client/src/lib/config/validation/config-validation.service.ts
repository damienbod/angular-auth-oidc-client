import { Injectable } from '@angular/core';
import { LoggerService } from '../../logging/logger.service';
import { OpenIdConfiguration } from '../openid-configuration';
import { Level, RuleValidationResult } from './rule';
import { allMultipleConfigRules, allRules } from './rules';

@Injectable({ providedIn: 'root' })
export class ConfigValidationService {
  constructor(private readonly loggerService: LoggerService) {}

  validateConfigs(passedConfigs: OpenIdConfiguration[]): boolean {
    return this.validateConfigsInternal(
      passedConfigs ?? [],
      allMultipleConfigRules
    );
  }

  validateConfig(passedConfig: OpenIdConfiguration): boolean {
    return this.validateConfigInternal(passedConfig, allRules);
  }

  private validateConfigsInternal(
    passedConfigs: OpenIdConfiguration[],
    allRulesToUse: any[]
  ): boolean {
    if (passedConfigs.length === 0) {
      return false;
    }

    const allValidationResults = allRulesToUse.map((rule) =>
      rule(passedConfigs)
    );

    let overallErrorCount = 0;

    passedConfigs.forEach((passedConfig) => {
      const errorCount = this.processValidationResultsAndGetErrorCount(
        allValidationResults,
        passedConfig
      );

      overallErrorCount += errorCount;
    });

    return overallErrorCount === 0;
  }

  private validateConfigInternal(
    passedConfig: OpenIdConfiguration,
    allRulesToUse: any[]
  ): boolean {
    const allValidationResults = allRulesToUse.map((rule) =>
      rule(passedConfig)
    );

    const errorCount = this.processValidationResultsAndGetErrorCount(
      allValidationResults,
      passedConfig
    );

    return errorCount === 0;
  }

  private processValidationResultsAndGetErrorCount(
    allValidationResults: RuleValidationResult[],
    config: OpenIdConfiguration
  ): number {
    const allMessages = allValidationResults.filter(
      (x) => x.messages.length > 0
    );
    const allErrorMessages = this.getAllMessagesOfType('error', allMessages);
    const allWarnings = this.getAllMessagesOfType('warning', allMessages);

    allErrorMessages.forEach((message) =>
      this.loggerService.logError(config, message)
    );
    allWarnings.forEach((message) =>
      this.loggerService.logWarning(config, message)
    );

    return allErrorMessages.length;
  }

  private getAllMessagesOfType(
    type: Level,
    results: RuleValidationResult[]
  ): string[] {
    const allMessages = results
      .filter((x) => x.level === type)
      .map((result) => result.messages);

    return allMessages.reduce((acc, val) => acc.concat(val), []);
  }
}
