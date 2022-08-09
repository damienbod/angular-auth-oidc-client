// eslint-disable-next-line no-shadow
export enum EventTypes {
  /**
   *  This only works in the AppModule Constructor
   */
  ConfigLoaded,
  Loading,
  LoadingFinished,
  LoadingFinishedWithError,
  ConfigLoadingFailed,
  CheckSessionReceived,
  UserDataChanged,
  NewAuthenticationResult,
  TokenExpired,
  IdTokenExpired,
  SilentRenewStarted,
}
