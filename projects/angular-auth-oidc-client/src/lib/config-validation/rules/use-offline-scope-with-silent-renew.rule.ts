import { OpenIdConfiguration } from '../../config/openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export function useOfflineScopeWithSilentRenew(passedConfig: OpenIdConfiguration): RuleValidationResult {
    const hasRefreshToken = passedConfig.useRefreshToken;
    const hasSilentRenew = passedConfig.silentRenew;
    const scope = passedConfig.scope || '';
    const hasOfflineScope = scope.split(' ').includes('offline_access');

    if (hasRefreshToken && hasSilentRenew && !hasOfflineScope) {
        return {
            result: false,
            messages: ['When using silent renew and refresh tokens please set the `offline_access` scope'],
            level: 'error',
        };
    }

    return POSITIVE_VALIDATION_RESULT;
}
