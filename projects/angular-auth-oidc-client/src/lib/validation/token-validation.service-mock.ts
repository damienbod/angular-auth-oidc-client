import { Observable, of } from 'rxjs';

export class TokenValidationServiceMock {
  hasIdTokenExpired(idToken: string, offsetSeconds?: number): boolean {
    return false;
  }

  validateIdTokenExpNotExpired(decodedIdToken: string, offsetSeconds?: number): boolean {
    return true;
  }

  validateRequiredIdToken(dataIdToken: any): boolean {
    return true;
  }

  validateIdTokenIatMaxOffset(dataIdToken: any, maxOffsetAllowedInSeconds: number, disableIatOffsetValidation: boolean): boolean {
    return true;
  }

  validateIdTokenNonce(dataIdToken: any, localNonce: any, ignoreNonceAfterRefresh: boolean): boolean {
    return true;
  }

  validateIdTokenIss(dataIdToken: any, authWellKnownEndpointsIssuer: any): boolean {
    return true;
  }

  validateIdTokenAud(dataIdToken: any, aud: any): boolean {
    return true;
  }

  validateStateFromHashCallback(state: any, localState: any): boolean {
    return true;
  }

  validateSignatureIdToken(idToken: any, jwtkeys: any): Observable<boolean> {
    return of(true);
  }

  hasConfigValidResponseType(responseType: string): boolean {
    return true;
  }

  validateIdTokenAtHash(accessToken: any, atHash: any, isCodeFlow: boolean): Observable<boolean> {
    return of(true);
  }

  generateCodeChallenge(codeVerifier: any): string {
    return '';
  }

  validateAccessTokenNotExpired(accessTokenExpiresAt: Date, offsetSeconds?: number): boolean {
    return true;
  }

  validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken: any): boolean {
    if (!dataIdToken) {
      return false;
    }

    if (Array.isArray(dataIdToken.aud) && dataIdToken.aud.length > 1 && !dataIdToken.azp) {
      return false;
    }

    return true;
  }

  validateIdTokenAzpValid(dataIdToken: any, clientId: string): boolean {
    if (!dataIdToken?.azp) {
      return true;
    }

    if (dataIdToken.azp === clientId) {
      return true;
    }

    return false;
  }
}
