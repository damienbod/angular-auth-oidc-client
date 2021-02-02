import { OpenIdConfiguration } from '../../config/openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

export const ensureStsServer = (passedConfig: OpenIdConfiguration): RuleValidationResult => {
  if (!passedConfig.stsServer) {
    return {
      result: false,
      messages: ['The STS URL MUST be provided in the configuration!'],
      level: 'error',
    };
  }

  return POSITIVE_VALIDATION_RESULT;
};
