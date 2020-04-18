import { Injectable } from '@angular/core';

// support for IE,  (window.crypto || window.msCrypto)
@Injectable({ providedIn: 'root' })
export class RandomService {
    createRandom(requiredLength: number): string {
        const length = requiredLength - 6;
        const arr = new Uint8Array((length || length) / 2);
        (window.crypto || (window as any).msCrypto).getRandomValues(arr);
        return Array.from(arr, this.toHex).join('') + this.randomString(7);
    }

    private toHex(dec) {
        return ('0' + dec.toString(16)).substr(-2);
    }

    private randomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        const values = new Uint32Array(length);
        (window.crypto || (window as any).msCrypto).getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += characters[values[i] % characters.length];
        }

        return result;
    }
}
