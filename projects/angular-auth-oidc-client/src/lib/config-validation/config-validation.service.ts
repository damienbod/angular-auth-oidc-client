import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../angular-auth-oidc-client';
import { LoggerService } from '../logging/logger.service';
import { Level, RuleValidationResult } from './rule';
import { allRules } from './rules';

@Injectable()
export class ConfigValidationService {
  constructor(private loggerService: LoggerService) {}

  validateConfig(passedConfig: OpenIdConfiguration): boolean {
    const allValidationResults = allRules.map((rule) => rule(passedConfig));

    const allMessages = allValidationResults.filter((x) => x.messages.length > 0);

    const allErrorMessages = this.getAllMessagesOfType('error', allMessages);
    const allWarnings = this.getAllMessagesOfType('warning', allMessages);
    allErrorMessages.map((message) => this.loggerService.logError(message));
    allWarnings.map((message) => this.loggerService.logWarning(message));

    return allErrorMessages.length === 0;
  }

  private getAllMessagesOfType(type: Level, results: RuleValidationResult[]) {
    const allMessages = results.filter((x) => x.level === type).map((result) => result.messages);
    return allMessages.reduce((acc, val) => acc.concat(val), []);
  }
}
