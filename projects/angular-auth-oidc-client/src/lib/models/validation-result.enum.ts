export enum ValidationResult {
    NotSet = 'NotSet',
    StatesDoNotMatch = 'StatesDoNotMatch',
    SignatureFailed = 'SignatureFailed',
    IncorrectNonce = 'IncorrectNonce',
    RequiredPropertyMissing = 'RequiredPropertyMissing',
    MaxOffsetExpired = 'MaxOffsetExpired',
    IssDoesNotMatchIssuer = 'IssDoesNotMatchIssuer',
    NoAuthWellKnownEndPoints = 'NoAuthWellKnownEndPoints',
    IncorrectAud = 'IncorrectAud',
    TokenExpired = 'TokenExpired',
    IncorrectAtHash = 'IncorrectAtHash',
    Ok = 'Ok',
    LoginRequired = 'LoginRequired',
    SecureTokenServerError = 'SecureTokenServerError'
}
