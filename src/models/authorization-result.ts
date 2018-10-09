import { AuthorizationState } from './authorization-state.enum';
import { ValidationResult } from './validation-result.enum';

export class AuthorizationResult {
    constructor(
        public authorizationState: AuthorizationState,
        public validationResult: ValidationResult
    ) {}
}
