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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  id_token?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  refresh_token?: string;
  error?: any;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  session_state?: any;
  state?: any;
}
