import { OpenIdConfiguration } from '../../openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export const useOfflineScopeWithSilentRenew = (
  passedConfig: OpenIdConfiguration
): RuleValidationResult => {
  const hasRefreshToken = passedConfig.useRefreshToken;
  const hasSilentRenew = passedConfig.silentRenew;
  const disableOfflineAccessScopeWarning =
    passedConfig.disableRefreshTokenOfflineAccessScopeWarning;
  const scope = passedConfig.scope || '';
  const hasOfflineScope = scope.split(' ').includes('offline_access');

  if (
    hasRefreshToken &&
    hasSilentRenew &&
    !hasOfflineScope &&
    !disableOfflineAccessScopeWarning
  ) {
    return {
      result: false,
      messages: [
        'When using silent renew and refresh tokens the `offline_access` scope is often required. If your provider supports this without it, set `disableRefreshTokenOfflineAccessScopeWarning` to suppress this warning.',
      ],
      level: 'warning',
    };
  }

  return POSITIVE_VALIDATION_RESULT;
};
