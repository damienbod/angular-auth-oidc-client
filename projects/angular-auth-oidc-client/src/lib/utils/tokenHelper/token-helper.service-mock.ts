export class TokenHelperServiceMock {
  getTokenExpirationDate(dataIdToken: any): Date {
    return null;
  }

  getHeaderFromToken(token: any, encoded: boolean) {
    return null;
  }

  getPayloadFromToken(token: any, encoded: boolean) {
    return null;
  }

  getSignatureFromToken(token: any, encoded: boolean) {
    return null;
  }
}
