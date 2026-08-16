import { OidcError } from '../flows/callback-handling/oidc-error';

export interface LoginResponse {
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId?: string;
  errorMessage?: string;
  oidcError?: OidcError;
}
