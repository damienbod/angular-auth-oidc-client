import { ValidationResult } from '../validation/validation-result';

export interface AuthorizationResult {
  isAuthorized: boolean;
  validationResult: ValidationResult;
  isRenewProcess: boolean;
}
