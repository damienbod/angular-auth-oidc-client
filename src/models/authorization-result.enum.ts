import { ValidationResult } from './validation-result.enum';

export class AuthorizationResult {
    constructor(
        public authorizationState: AuthorizationState,
        public validationResult: ValidationResult
    ) {}
}

export enum AuthorizationState {
    authorized = 1,
    forbidden = 2,
    unauthorized = 3,
}
