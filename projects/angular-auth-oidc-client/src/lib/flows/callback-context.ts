import { JwtKeys } from '../validation/jwtkeys';
import { StateValidationResult } from '../validation/state-validation-result';
export interface CallbackContext {
    code: string;
    refreshToken: string;
    state: string;
    sessionState: string | null;
    authResult: any;
    isRenewProcess: boolean;
    jwtKeys: JwtKeys;
    validationResult: StateValidationResult;
}
