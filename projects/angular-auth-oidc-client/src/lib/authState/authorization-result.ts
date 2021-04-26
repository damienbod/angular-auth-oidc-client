import { ValidationResult } from '../validation/validation-result';

export interface AuthorizationResult {
  isAuthenticated: boolean;
  validationResult: ValidationResult;
  isRenewProcess: boolean;
}
