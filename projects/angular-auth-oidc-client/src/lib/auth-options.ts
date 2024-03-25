export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): void;
  /** overrides redirectUrl from configuration */
  redirectUrl?: string;
}

export interface LogoutAuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): void;
  logoffMethod?: 'GET' | 'POST';
}
