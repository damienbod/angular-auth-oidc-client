import { ValidationResult } from '../validation/validation-result';
import { AuthorizationState } from './authorization-state.enum';

export class AuthorizationResult {
    constructor(
        public authorizationState: AuthorizationState,
        public validationResult: ValidationResult,
        public isRenewProcess: boolean = false
    ) {}
}
