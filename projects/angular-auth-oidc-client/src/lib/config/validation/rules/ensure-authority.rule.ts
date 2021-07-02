import { OpenIdConfiguration } from '../../openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export const ensureAuthority = (passedConfig: OpenIdConfiguration): RuleValidationResult => {
  if (!passedConfig.authority) {
    return {
      result: false,
      messages: ['The authority URL MUST be provided in the configuration! '],
      level: 'error',
    };
  }

  return POSITIVE_VALIDATION_RESULT;
};
