import { OpenIdConfiguration } from '../config/openid-configuration';

export interface Rule {
    validate(passedConfig: OpenIdConfiguration): RuleValidationResult;
}

export interface RuleValidationResult {
    result: boolean;
    messages: string[];
    level: Level;
}

export const POSITIVE_VALIDATION_RESULT = {
    result: true,
    messages: [],
    level: null,
};

export type Level = 'warning' | 'error';
