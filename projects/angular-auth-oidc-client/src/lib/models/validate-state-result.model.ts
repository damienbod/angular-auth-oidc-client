import { ValidationResult } from './validation-result.enum';

export class ValidateStateResult {
    constructor(
        public accessToken = '',
        public idToken = '',
        public authResponseIsValid = false,
        public decodedIdToken: any = {},
        public state: ValidationResult = ValidationResult.NotSet
    ) {}
}
