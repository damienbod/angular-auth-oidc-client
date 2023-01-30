export interface AuthenticatedResult {
  isAuthenticated: boolean;
  allConfigsAuthenticated: ConfigAuthenticatedResult[];
}

export interface ConfigAuthenticatedResult {
  configId: string;
  isAuthenticated: boolean;
}
