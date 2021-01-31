/* eslint-disable no-shadow */
export enum ValidationResult {
    notSet = 'NotSet',
    statesDoNotMatch = 'StatesDoNotMatch',
    signatureFailed = 'SignatureFailed',
    incorrectNonce = 'IncorrectNonce',
    requiredPropertyMissing = 'RequiredPropertyMissing',
    maxOffsetExpired = 'MaxOffsetExpired',
    issDoesNotMatchIssuer = 'IssDoesNotMatchIssuer',
    noAuthWellKnownEndPoints = 'NoAuthWellKnownEndPoints',
    incorrectAud = 'IncorrectAud',
    incorrectIdTokenClaimsAfterRefresh = 'IncorrectIdTokenClaimsAfterRefresh',
    incorrectAzp = 'IncorrectAzp',
    tokenExpired = 'TokenExpired',
    incorrectAtHash = 'IncorrectAtHash',
    ok = 'Ok',
    loginRequired = 'LoginRequired',
    secureTokenServerError = 'SecureTokenServerError',
}
