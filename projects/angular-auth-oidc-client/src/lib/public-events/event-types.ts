// eslint-disable-next-line no-shadow
export enum EventTypes {
  /**
   *  This only works in the AppModule Constructor
   */
  ConfigLoaded,
  ConfigLoadingFailed,
  CheckSessionReceived,
  UserDataChanged,
  NewAuthorizationResult,
  TokenExpired,
  IdTokenExpired,
  SilentRenewStarted,
}
