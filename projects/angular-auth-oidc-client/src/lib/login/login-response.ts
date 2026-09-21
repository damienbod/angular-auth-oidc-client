export interface LoginResponse {
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId?: string;
  errorMessage?: string;
  /**
   * The `error_description` of the error callback of the identity provider, if
   * it sent one. It is set next to the `error` in `errorMessage` when a silent
   * renew came back with an OAuth error, and tells apart failures that share
   * the same `error`.
   */
  errorDescription?: string;
}
