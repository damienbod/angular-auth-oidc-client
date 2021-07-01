import { ValidationResult } from '../validation/validation-result';

export interface AuthenticatedResult {
  isAuthenticated: boolean;
  validationResult: ValidationResult;
  isRenewProcess: boolean;
}

export interface ConfigAuthenticatedResult {
  isAuthenticated: boolean;

  allConfigsAuthenticated: ConfigAuthenticated[];
}

export interface ConfigAuthenticated {
  configId: string;
  isAuthenticated: boolean;
}
