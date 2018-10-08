export enum ValidationResult {
    NotSet,
    StatesDoNotMatch,
    SignatureFailed,
    IncorrectNonce,
    RequiredPropertyMissing,
    MaxOffsetExpired,
    IssDoesNotMatchIssuer,
    NoAuthWellKnownEndPoints,
    IncorrectAud,
    TokenExpired,
    IncorrectAtHash,
    Ok,
}
