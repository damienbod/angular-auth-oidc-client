import { OpenIdConfiguration } from '../../openid-configuration';
import { POSITIVE_VALIDATION_RESULT, RuleValidationResult } from '../rule';

const createIdentifierToCheck = (passedConfig: OpenIdConfiguration): string => {
  if (!passedConfig) {
    return '';
  }

  const { authority, clientId, scope } = passedConfig;

  return `${authority}${clientId}${scope}`;
};const arrayHasDuplicates = (array: string[]): boolean =>
  new Set(array).size !== array.length;

export const ensureNoDuplicatedConfigsRule = (
  passedConfigs: OpenIdConfiguration[]
): RuleValidationResult => {
  const allIdentifiers = passedConfigs.map((x) => createIdentifierToCheck(x));  const someAreNotSet = allIdentifiers.some((x) => x === '');

  if (someAreNotSet) {
    return {
      result: false,
      messages: [
        `Please make sure you add an object with a 'config' property: ....({ config }) instead of ...(config)`,
      ],
      level: 'error',
    };
  }

  const hasDuplicates = arrayHasDuplicates(allIdentifiers);

  if (hasDuplicates) {
    return {
      result: false,
      messages: [
        'You added multiple configs with the same authority, clientId and scope',
      ],
      level: 'warning',
    };
  }

  return POSITIVE_VALIDATION_RESULT;
};
