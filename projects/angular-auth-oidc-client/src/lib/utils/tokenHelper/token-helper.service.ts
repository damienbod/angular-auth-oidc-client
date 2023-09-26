import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';

const PARTS_OF_TOKEN = 3;

@Injectable({ providedIn: 'root' })
export class TokenHelperService {
  constructor(
    private readonly loggerService: LoggerService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  getTokenExpirationDate(dataIdToken: any): Date {
    if (!Object.prototype.hasOwnProperty.call(dataIdToken, 'exp')) {
      return new Date(new Date().toUTCString());
    }

    const date = new Date(0); // The 0 here is the key, which sets the date to the epoch

    date.setUTCSeconds(dataIdToken.exp);

    return date;
  }

  getSigningInputFromToken(
    token: any,
    encoded: boolean,
    configuration: OpenIdConfiguration
  ): string {
    if (!this.tokenIsValid(token, configuration)) {
      return '';
    }

    const header: string = this.getHeaderFromToken(
      token,
      encoded,
      configuration
    );
    const payload: string = this.getPayloadFromToken(
      token,
      encoded,
      configuration
    );

    return [header, payload].join('.');
  }

  getHeaderFromToken(
    token: any,
    encoded: boolean,
    configuration: OpenIdConfiguration
  ): any {
    if (!this.tokenIsValid(token, configuration)) {
      return {};
    }

    return this.getPartOfToken(token, 0, encoded);
  }

  getPayloadFromToken(
    token: any,
    encoded: boolean,
    configuration: OpenIdConfiguration
  ): any {
    if (!this.tokenIsValid(token, configuration)) {
      return {};
    }

    return this.getPartOfToken(token, 1, encoded);
  }

  getSignatureFromToken(
    token: any,
    encoded: boolean,
    configuration: OpenIdConfiguration
  ): any {
    if (!this.tokenIsValid(token, configuration)) {
      return {};
    }

    return this.getPartOfToken(token, 2, encoded);
  }

  private getPartOfToken(token: string, index: number, encoded: boolean): any {
    const partOfToken = this.extractPartOfToken(token, index);

    if (encoded) {
      return partOfToken;
    }

    const result = this.urlBase64Decode(partOfToken);

    return JSON.parse(result);
  }

  private urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');

    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw Error('Illegal base64url string!');
    }

    const decoded =
      typeof this.document.defaultView !== 'undefined'
        ? this.document.defaultView?.atob(output)
        : Buffer.from(output, 'base64').toString('binary');

    if (!decoded) {
      return '';
    }

    try {
      // Going backwards: from byte stream, to percent-encoding, to original string.
      return decodeURIComponent(
        decoded
          .split('')
          .map(
            (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          )
          .join('')
      );
    } catch (err) {
      return decoded;
    }
  }

  private tokenIsValid(
    token: string,
    configuration: OpenIdConfiguration
  ): boolean {
    if (!token) {
      this.loggerService.logError(
        configuration,
        `token '${token}' is not valid --> token falsy`
      );

      return false;
    }

    if (!(token as string).includes('.')) {
      this.loggerService.logError(
        configuration,
        `token '${token}' is not valid --> no dots included`
      );

      return false;
    }

    const parts = token.split('.');

    if (parts.length !== PARTS_OF_TOKEN) {
      this.loggerService.logError(
        configuration,
        `token '${token}' is not valid --> token has to have exactly ${
          PARTS_OF_TOKEN - 1
        } dots`
      );

      return false;
    }

    return true;
  }

  private extractPartOfToken(token: string, index: number): string {
    return token.split('.')[index];
  }
}
