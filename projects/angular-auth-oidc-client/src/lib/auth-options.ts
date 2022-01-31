export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): any;
  /** overrides redirectUrl from configuration */
  redirectUrl?: string;
}
