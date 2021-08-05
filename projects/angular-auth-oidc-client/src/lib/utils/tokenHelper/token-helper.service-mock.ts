export class TokenHelperServiceMock {
  getTokenExpirationDate(dataIdToken: any): Date {
    return null;
  }

  getSigningInputFromToken(token: any, encoded: boolean, configId: string): any {
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
