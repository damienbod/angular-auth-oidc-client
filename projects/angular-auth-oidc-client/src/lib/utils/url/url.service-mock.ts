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

  getRefreshSessionSilentRenewUrl(): Promise<string> {
    return Promise.resolve('');
  }

  getAuthorizeUrl(customParams?: { [key: string]: string | number | boolean }): Promise<string> {
    return Promise.resolve('someUrl');
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

  createBodyForParCodeFlowRequest(customParamsRequest?: { [key: string]: string | number | boolean }): Promise<string> {
    return Promise.resolve('');
  }

  private async createUrlCodeFlowWithSilentRenew(
    configId: string,
    customParams?: { [key: string]: string | number | boolean }
  ): Promise<string> {
    return Promise.resolve('');
  }

  getAuthorizeParUrl(request_uri: string): string {
    return '';
  }
}
