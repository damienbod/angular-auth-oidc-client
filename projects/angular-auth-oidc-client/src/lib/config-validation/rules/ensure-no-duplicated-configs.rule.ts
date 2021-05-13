import { OpenIdConfiguration } from '../../config/openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

const createIdentifierToCheck = (passedConfig: OpenIdConfiguration): string => {
  const { stsServer, clientId, scope } = passedConfig;
  return `${stsServer}${clientId}${scope}`;
};

const arrayHasDuplicates = (array: string[]) => new Set(array).size !== array.length;

export const ensureNoDuplicatedConfigsRule = (passedConfigs: OpenIdConfiguration[]): RuleValidationResult => {
  const allIdentifiers = passedConfigs.map((x) => createIdentifierToCheck(x));

  const hasDuplicates = arrayHasDuplicates(allIdentifiers);

  if (hasDuplicates) {
    return {
      result: false,
      messages: ['You added multiple configs with the same stsServer, clientId and scope'],
      level: 'warning',
    };
  }

  return POSITIVE_VALIDATION_RESULT;
};
