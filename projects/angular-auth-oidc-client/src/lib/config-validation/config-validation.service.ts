import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../angular-auth-oidc-client';
import { LoggerService } from '../logging/logger.service';
import { allRules } from './rules';

@Injectable({ providedIn: 'root' })
export class ConfigValidationService {
    constructor(private loggerService: LoggerService) {}

    validateConfig(passedConfig: OpenIdConfiguration): boolean {
        const allValidationResults = allRules.map((rule) => rule(passedConfig));

        const allMessages = allValidationResults.filter((x) => x.messages.length > 0);

        const allErrors = allMessages.filter((x) => x.level === 'error');
        allErrors.map((message) => this.loggerService.logError(message));

        allMessages.filter((x) => x.level === 'warning').map((message) => this.loggerService.logWarning(message));

        return allErrors.length > 0;
    }
}
