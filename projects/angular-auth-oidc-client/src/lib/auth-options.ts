export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): any;
  /** overrides redirectUrl from configuration */
  redirectUrl?: string;
}

export interface LogoutAuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): any;
  logoffMethod?: 'GET' | 'POST';
}
