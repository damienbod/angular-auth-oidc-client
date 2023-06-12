import { OpenIdConfiguration } from '../../openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export const ensureClientId = (
  passedConfig: OpenIdConfiguration
): RuleValidationResult => {
  if (!passedConfig.clientId) {
    return {
      result: false,
      messages: ['The clientId is required and missing from your config!'],
      level: 'error',
    };
  }

  return POSITIVE_VALIDATION_RESULT;
};
