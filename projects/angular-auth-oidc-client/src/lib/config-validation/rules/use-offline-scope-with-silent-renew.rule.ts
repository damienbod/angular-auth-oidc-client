import { OpenIdConfiguration } from '../../config/openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export function useOfflineScopeWithSilentRenew(passedConfig: OpenIdConfiguration): RuleValidationResult {
    const hasRefreshToken = passedConfig.useRefreshToken;
    const hasSilentRenew = passedConfig.silentRenew;
    const hasOfflineScope = passedConfig.scope.split(' ').includes('offline_access');

    if (hasRefreshToken && hasSilentRenew && !hasOfflineScope) {
        return {
            result: false,
            messages: ['When using silentRenew and refresh tokens please set the `offline_access` scope'],
            level: 'warning',
        };
    }

    return POSITIVE_VALIDATION_RESULT;
}
