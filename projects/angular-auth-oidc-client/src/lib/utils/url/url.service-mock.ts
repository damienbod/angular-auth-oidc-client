import { Injectable } from '@angular/core';
import { Observable, of } from "rxjs";

@Injectable()
export class UrlServiceMock {
  constructor() {}

  getUrlParameter(urlToCheck: any, name: any): string {
    return '';
  }

  isCallbackFromSts() {
    return true;
  }

  getRefreshSessionSilentRenewUrl(): Observable<string> {
    return of('');
  }

  getAuthorizeUrl(customParams?: { [key: string]: string | number | boolean }): Observable<string> {
    return of('someUrl');
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
