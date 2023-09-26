import { OpenIdConfiguration } from '../openid-configuration';

export interface Rule {
  validate(passedConfig: OpenIdConfiguration): RuleValidationResult;
}

export interface RuleValidationResult {
  result: boolean;
  messages: string[];
  level: Level;
}

export const POSITIVE_VALIDATION_RESULT: RuleValidationResult = {
  result: true,
  messages: [],
  level: 'none',
};

export type Level = 'warning' | 'error' | 'none';
