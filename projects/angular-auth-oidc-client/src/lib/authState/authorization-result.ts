import { ValidationResult } from '../validation/validation-result';

export interface AuthorizationResult {
  isAuthenticated: boolean;
  validationResult: ValidationResult;
  isRenewProcess: boolean;
}

export interface ConfigAuthorizedResult {
  configId: string;
  isAuthenticated: boolean;
}
