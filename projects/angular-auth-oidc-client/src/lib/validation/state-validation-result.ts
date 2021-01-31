import { ValidationResult } from './validation-result';

export class StateValidationResult {
    constructor(
        public accessToken = '',
        public idToken = '',
        public authResponseIsValid = false,
        public decodedIdToken: any = {},
        public state: ValidationResult = ValidationResult.notSet
    ) {}
}
