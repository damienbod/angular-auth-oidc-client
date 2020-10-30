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

    validateSignatureIdToken(idToken: any, jwtkeys: any): boolean {
        return true;
    }

    configValidateResponseType(responseType: string): boolean {
        return true;
    }

    validateIdTokenAtHash(accessToken: any, atHash: any, isCodeFlow: boolean): boolean {
        return true;
    }

    generateCodeChallenge(codeVerifier: any): string {
        return '';
    }

    validateAccessTokenNotExpired(accessTokenExpiresAt: Date, offsetSeconds?: number): boolean {
        return true;
    }
}
