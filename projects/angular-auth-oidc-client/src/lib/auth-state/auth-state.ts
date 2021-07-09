import { ValidationResult } from '../validation/validation-result';

export interface AuthStateResult {
  isAuthenticated: boolean;
  validationResult: ValidationResult;
  isRenewProcess: boolean;
}
