import { OpenIdConfiguration } from '../../openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export const ensureRedirectRule = (
  passedConfig: OpenIdConfiguration
): RuleValidationResult => {
  if (!passedConfig.redirectUrl) {
    return {
      result: false,
      messages: ['The redirectUrl is required and missing from your config'],
      level: 'error',
    };
  }

  return POSITIVE_VALIDATION_RESULT;
};
