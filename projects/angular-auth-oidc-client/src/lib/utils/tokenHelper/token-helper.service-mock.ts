export class TokenHelperServiceMock {
  getTokenExpirationDate(dataIdToken: any): Date {
    return null;
  }

  getSigningInputFromToken(token: any, encoded: boolean, configId: string): any {
    return '';
  }

  getHeaderFromToken(token: any, encoded: boolean) {
    return '';
  }

  getPayloadFromToken(token: any, encoded: boolean) {
    return '';
  }

  getSignatureFromToken(token: any, encoded: boolean) {
    return '';
  }
}
