import { Injectable } from '@angular/core';

@Injectable()
export class UrlServiceMock {
    constructor() {}

    getUrlParameter(urlToCheck: any, name: any): string {
        return '';
    }

    isCallbackFromSts() {
        return true;
    }

    getRefreshSessionSilentRenewUrl(): string {
        return '';
    }

    getAuthorizeUrl(customParams?: { [key: string]: string | number | boolean }): string {
        return '';
    }

    createEndSessionUrl(idTokenHint: string) {
        return '';
    }

    createRevocationEndpointBodyAccessToken(token: any) {
        return '';
    }

    createRevocationEndpointBodyRefreshToken(token: any) {
        return '';
    }

    getRevocationEndpointUrl() {
        return '';
    }

    createBodyForCodeFlowCodeRequest(code: string): string {
        return '';
    }

    createBodyForCodeFlowRefreshTokensRequest(refreshtoken: string): string {
        return '';
    }
}
