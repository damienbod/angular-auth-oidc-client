import { ValidationResult } from '../validation/validation-result';

export interface AuthenticatedResult {
  isAuthenticated: boolean;
  validationResult: ValidationResult;
  isRenewProcess: boolean;
}

export interface ConfigAuthenticatedResult {
  configId: string;
  isAuthenticated: boolean;
}
