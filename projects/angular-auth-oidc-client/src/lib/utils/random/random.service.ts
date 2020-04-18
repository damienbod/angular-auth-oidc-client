import { Injectable } from '@angular/core';
import { LoggerService } from '../../logging/logger.service';

@Injectable({ providedIn: 'root' })
export class RandomService {
    constructor(private loggerService: LoggerService) {}

    createRandom(requiredLength: number): string {
        if (requiredLength <= 0) {
            return '';
        }

        if (requiredLength > 0 && requiredLength < 7) {
            this.loggerService.logWarning(`RandomService called with ${requiredLength} but 7 chars is the minimum, returning 7 chars`);
        }

        const length = requiredLength - 6;
        const arr = new Uint8Array((length || length) / 2);
        this.getCrypto().getRandomValues(arr);
        return Array.from(arr, this.toHex).join('') + this.randomString(7);
    }

    private toHex(dec) {
        return ('0' + dec.toString(16)).substr(-2);
    }

    private randomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        const values = new Uint32Array(length);
        this.getCrypto().getRandomValues(values);
        for (let i = 0; i < length; i++) {
            result += characters[values[i] % characters.length];
        }

        return result;
    }
    private getCrypto() {
        // support for IE,  (window.crypto || window.msCrypto)
        return window.crypto || (window as any).msCrypto;
    }
}
