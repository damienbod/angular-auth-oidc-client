import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { LoggerService } from '../../logging/logger.service';

@Injectable()
export class RandomService {
  constructor(@Inject(DOCUMENT) private readonly doc: any, private loggerService: LoggerService) {}

  createRandom(requiredLength: number): string {
    if (requiredLength <= 0) {
      return '';
    }

    if (requiredLength > 0 && requiredLength < 7) {
      this.loggerService.logWarning(`RandomService called with ${requiredLength} but 7 chars is the minimum, returning 10 chars`);
      requiredLength = 10;
    }

    const length = requiredLength - 6;
    const arr = new Uint8Array(length / 2);
    if (this.getCrypto()) {
      this.getCrypto().getRandomValues(arr);
    }

    return Array.from(arr, this.toHex).join('') + this.randomString(7);
  }

  private toHex(dec) {
    return ('0' + dec.toString(16)).substr(-2);
  }

  private randomString(length): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const values = new Uint32Array(length);
    if (this.getCrypto()) {
      this.getCrypto().getRandomValues(values);
      for (let i = 0; i < length; i++) {
        result += characters[values[i] % characters.length];
      }
    }

    return result;
  }

  private getCrypto() {
    // support for IE,  (window.crypto || window.msCrypto)
    return this.doc.defaultView.crypto || (this.doc.defaultView as any).msCrypto;
  }
}
