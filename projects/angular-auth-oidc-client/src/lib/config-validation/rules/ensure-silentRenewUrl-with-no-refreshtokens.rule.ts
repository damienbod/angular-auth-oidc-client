import { OpenIdConfiguration } from '../../config/openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export function ensureSilentRenewUrlWhenNoRefreshTokenUsed(passedConfig: OpenIdConfiguration): RuleValidationResult {
    const usesSilentRenew = passedConfig.silentRenew;
    const usesRefreshToken = passedConfig.useRefreshToken;
    const hasSilentRenewUrl = passedConfig.silentRenewUrl;

    if (usesSilentRenew && !usesRefreshToken && !hasSilentRenewUrl) {
        return {
            result: false,
            messages: ['Please provide a silent renew URL if using renew and not refresh tokens'],
            level: 'error',
        };
    }

    return POSITIVE_VALIDATION_RESULT;
}
