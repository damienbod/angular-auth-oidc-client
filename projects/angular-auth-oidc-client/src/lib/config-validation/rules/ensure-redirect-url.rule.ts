import { OpenIdConfiguration } from '../../config/openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export function ensureRedirectRule(passedConfig: OpenIdConfiguration): RuleValidationResult {
    if (!passedConfig.redirectUrl) {
        return {
            result: false,
            messages: ['Please provide a redirect rule'],
            level: 'error',
        };
    }

    return POSITIVE_VALIDATION_RESULT;
}
