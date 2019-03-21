import { ValidationResult } from './validation-result.enum';

export class ValidateStateResult {
    constructor(
        public access_token = '',
        public id_token = '',
        public authResponseIsValid = false,
        public decoded_id_token: any = {},
        public state: ValidationResult = ValidationResult.NotSet
    ) {}
}
