export class JwtWindowCryptoServiceMock {
  generateCodeChallenge(codeVerifier: any): string {
    return '';
  }

  generateAtHash(accessToken: any, sha: string): string {
    return '';
  }
}
