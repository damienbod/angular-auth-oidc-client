// eslint-disable-next-line no-shadow
export enum EventTypes {
  /**
   *  This only works in the AppModule Constructor
   */
  configLoaded,
  configLoadingFailed,
  checkSessionReceived,
  userDataChanged,
  newAuthorizationResult,
  tokenExpired,
  idTokenExpired,
}
