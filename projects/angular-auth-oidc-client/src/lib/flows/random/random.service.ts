import { inject, Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/services/logger.service';
import { CryptoService } from '../../utils/crypto/crypto.service';

@Injectable({ providedIn: 'root' })
export class RandomService {
  private readonly loggerService = inject(LoggerService);
  private readonly cryptoService = inject(CryptoService);

  createRandom(
    requiredLength: number,
    configuration: OpenIdConfiguration
  ): string {
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

    // each byte becomes two hex chars, the rest (at least 7) is a random string
    const arr = new Uint8Array(Math.floor((requiredLength - 7) / 2));
    const crypto = this.cryptoService.getCrypto();

    if (crypto) {
      crypto.getRandomValues(arr);
    }

    return (
      Array.from(arr, this.toHex).join('') +
      this.randomString(requiredLength - arr.length * 2)
    );
  }

  private toHex(dec: number): string {
    return ('0' + dec.toString(16)).substr(-2);
  }

  private randomString(length: number): string {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
