import { ValidationResult } from '../validation/validation-result';
import { AuthorizedState } from './authorized-state';

export interface AuthorizationResult {
  authorizationState: AuthorizedState;
  validationResult: ValidationResult;
  isRenewProcess: boolean;
}
