export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): void;
  /** overrides redirectUrl from configuration */
  redirectUrl?: string;
  /** Restores the current route after a successful checkAuth. Only used by authorize(), not popup login. */
  restoreRoute?: boolean;
}

export interface LogoutAuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): void;
  logoffMethod?: 'GET' | 'POST';
}
