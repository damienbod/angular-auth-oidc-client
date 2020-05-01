export enum EventTypes {
    /**
     *  This only works in the AppModule Constructor
     */
    ConfigLoaded,
    CheckSessionReceived,
    UserDataChanged,
    NewAuthorizationResult,
    TokenExpired,
    IdTokenExpired,
}
