import { Injectable } from '@angular/core';
import { Buffer } from 'buffer';

@Injectable()
export class TokenHelperService {
    constructor() {}

    getTokenExpirationDate(dataIdToken: any): Date {
        if (!dataIdToken.hasOwnProperty('exp')) {
            return new Date();
        }

        const date = new Date(0); // The 0 here is the key, which sets the date to the epoch
        date.setUTCSeconds(dataIdToken.exp);

        return date;
    }

    getPayloadFromToken(token: any, encode: boolean) {
        let data = {};
        if (typeof token !== 'undefined') {
            const encoded = token.split('.')[1];
            if (encode) {
                return encoded;
            }
            data = JSON.parse(this.urlBase64Decode(encoded));
        }

        return data;
    }

    getHeaderFromToken(token: any, encode: boolean) {
        let data = {};
        if (typeof token !== 'undefined') {
            const encoded = token.split('.')[0];
            if (encode) {
                return encoded;
            }
            data = JSON.parse(this.urlBase64Decode(encoded));
        }

        return data;
    }

    getSignatureFromToken(token: any, encode: boolean) {
        let data = {};
        if (typeof token !== 'undefined') {
            const encoded = token.split('.')[2];
            if (encode) {
                return encoded;
            }
            data = JSON.parse(this.urlBase64Decode(encoded));
        }

        return data;
    }

    urlBase64Decode(str: string) {
        let output = str.replace('-', '+').replace('_', '/');
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

        return typeof window !== 'undefined'
            ? window.atob(output)
            : new Buffer(output, 'base64').toString('binary');
    }
}
