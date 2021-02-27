export interface JwtKeys {
  keys: JwtKey[];
}

export interface JwtKey {
  kty: string;
  use: string;
  kid: string;
  x5t: string;
  e: string;
  n: string;
  x5c: any[];
}
