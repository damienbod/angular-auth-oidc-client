import { Injectable } from '@angular/core';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class TokenHelperService {
    private PARTS_OF_TOKEN = 3;
    constructor(private readonly loggerService: LoggerService) {}

    getTokenExpirationDate(dataIdToken: any): Date {
        if (!dataIdToken.hasOwnProperty('exp')) {
            return new Date();
        }

        const date = new Date(0); // The 0 here is the key, which sets the date to the epoch
        date.setUTCSeconds(dataIdToken.exp);

        return date;
    }

    getHeaderFromToken(token: any, encoded: boolean) {
        if (!this.tokenIsValid(token)) {
            return {};
        }

        return this.getPartOfToken(token, 0, encoded);
    }

    getPayloadFromToken(token: any, encoded: boolean) {
        if (!this.tokenIsValid(token)) {
            return {};
        }

        return this.getPartOfToken(token, 1, encoded);
    }

    getSignatureFromToken(token: any, encoded: boolean) {
        if (!this.tokenIsValid(token)) {
            return {};
        }

        return this.getPartOfToken(token, 2, encoded);
    }

    private getPartOfToken(token: string, index: number, encoded: boolean) {
        const partOfToken = this.extractPartOfToken(token, index);

        if (encoded) {
            return partOfToken;
        }

        const result = this.urlBase64Decode(partOfToken);
        return JSON.parse(result);
    }

    private urlBase64Decode(str: string) {
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

        const decoded = typeof window !== 'undefined' ? window.atob(output) : new Buffer(output, 'base64').toString('binary');

        try {
            // Going backwards: from bytestream, to percent-encoding, to original string.
            return decodeURIComponent(decoded.split('')
                .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join(''));
        } catch (err) {
            return decoded;
        }
    }

    private tokenIsValid(token: string) {
        if (!token) {
            this.loggerService.logError(`token '${token}' is not valid --> token falsy`);
            return false;
        }

        if (!(token as string).includes('.')) {
            this.loggerService.logError(`token '${token}' is not valid --> no dots included`);
            return false;
        }

        const parts = token.split('.');

        if (parts.length !== this.PARTS_OF_TOKEN) {
            this.loggerService.logError(`token '${token}' is not valid --> token has t have exact three dots`);
            return false;
        }

        return true;
    }

    private extractPartOfToken(token: string, index: number) {
        return token.split('.')[index];
    }
}
