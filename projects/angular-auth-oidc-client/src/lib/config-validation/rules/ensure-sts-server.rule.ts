import { OpenIdConfiguration } from '../../config/openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export function ensureStsServer(passedConfig: OpenIdConfiguration): RuleValidationResult {
    if (!passedConfig.stsServer) {
        return {
            result: false,
            messages: ['Please provide at least an sts server'],
            level: 'error',
        };
    }

    return POSITIVE_VALIDATION_RESULT;
}
