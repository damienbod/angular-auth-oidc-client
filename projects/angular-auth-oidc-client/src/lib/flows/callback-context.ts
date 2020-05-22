import { JwtKeys } from '../validation/jwtkeys';
import { StateValidationResult } from '../validation/state-validation-result';
export interface CallbackContext {
    code: string;
    refreshToken: string;
    state: string;
    sessionState: string | null;
    authResult: AuthResult;
    isRenewProcess: boolean;
    jwtKeys: JwtKeys;
    validationResult: StateValidationResult;
    existingIdToken: any;
}

export interface AuthResult {
    id_token: string;
    access_token: string;
    error: any;
    session_state: any;
}
