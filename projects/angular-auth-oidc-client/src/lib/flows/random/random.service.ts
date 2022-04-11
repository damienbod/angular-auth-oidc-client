import { Injectable } from '@angular/core';
import { LoggerService } from '../../logging/logger.service';
import { CryptoService } from '../../utils/crypto/crypto-service';
import { OpenIdConfiguration } from './../../config/openid-configuration';

@Injectable()
export class RandomService {
  constructor(private cryptoService: CryptoService, private loggerService: LoggerService) {}

  createRandom(requiredLength: number, configuration: OpenIdConfiguration): string {
    if (requiredLength <= 0) {
      return '';
    }

    if (requiredLength > 0 && requiredLength < 7) {
      this.loggerService.logWarning(
        configuration,
        `RandomService called with ${requiredLength} but 7 chars is the minimum, returning 10 chars`
      );
      requiredLength = 10;
    }

    const length = requiredLength - 6;
    const arr = new Uint8Array(Math.floor(length / 2));
    const crypto = this.cryptoService.getCrypto();

    if (crypto) {
      crypto.getRandomValues(arr);
    }

    return Array.from(arr, this.toHex).join('') + this.randomString(7);
  }

  private toHex(dec): string {
    return ('0' + dec.toString(16)).substr(-2);
  }

  private randomString(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const values = new Uint32Array(length);
    const crypto = this.cryptoService.getCrypto();

    if (crypto) {
      crypto.getRandomValues(values);
      for (let i = 0; i < length; i++) {
        result += characters[values[i] % characters.length];
      }
    }

    return result;
  }
}
