export interface TokensResult {
  /**
   * The access token. Empty if the flow does not return one, e.g. `id_token` only.
   */
  accessToken: string;
  idToken: string;
  /**
   * The user data of the config the tokens belong to, `null` if there are none.
   */
  userData: any;
  /**
   * `true` if the tokens come from a renewal (silent renew with iframe or refresh
   * token), `false` for a login or a callback.
   */
  isRenewProcess: boolean;
  configId?: string;
}
