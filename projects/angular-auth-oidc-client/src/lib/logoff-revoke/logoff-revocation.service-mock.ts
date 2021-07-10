export class LogoffRevocationServiceMock {
  logoff(urlHandler?: (url: string) => any) {}

  logoffLocal() {}

  logoffLocalMultiple() {}

  logoffAndRevokeTokens(urlHandler?: (url: string) => any) {}

  revokeAccessToken(accessToken?: any) {}

  revokeRefreshToken(refreshToken?: any) {}

  getEndSessionUrl(): string | null {
    return null;
  }
}
