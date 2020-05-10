import { oneLineTrim } from 'common-tags';

export class UrlServiceMock {
    getUrlParameter(urlToCheck: any, name: any): string {
        return 'got';
    }

    isCallbackFromSts() {
        return false;
    }

    getRefreshSessionSilentRenewUrl(): string {
        return 'https://testrenew';
    }

    getAuthorizeUrl(customParams?: { [key: string]: string | number | boolean }): string {
        return 'https://testrenew';
    }

    createEndSessionUrl(idTokenHint: string) {
        return 'https://endsession.co';
    }

    createRevocationEndpointBodyAccessToken(token: any) {
        return `client_id=test&token=${token}&token_type_hint=access_token`;
    }

    createRevocationEndpointBodyRefreshToken(token: any) {
        return `client_id=test&token=${token}&token_type_hint=refresh_token`;
    }

    getRevocationEndpointUrl() {
        return 'https://revoke.co';
    }

    createBodyForCodeFlowCodeRequest(code: string): string {
        return oneLineTrim`${code}&redirect_uri=https://ret`;
    }

    createBodyForCodeFlowRefreshTokensRequest(refreshtoken: string): string {
        return oneLineTrim`grant_type=refresh_token
          &client_id=test
          &refresh_token=${refreshtoken}`;
    }

    private createAuthorizeUrl(
        codeChallenge: string,
        redirectUrl: string,
        nonce: string,
        state: string,
        prompt?: string,
        customRequestParams?: { [key: string]: string | number | boolean }
    ): string {
        return `https://authUrl?some=sss`;
    }
}
