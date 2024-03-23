import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CryptoService } from '../utils/crypto/crypto.service';

@Injectable({ providedIn: 'root' })
export class JwtWindowCryptoService {
  constructor(private readonly cryptoService: CryptoService) {}

  generateCodeChallenge(codeVerifier: string): Observable<string> {
    return this.calcHash(codeVerifier).pipe(
      map((challengeRaw: string) => this.base64UrlEncode(challengeRaw))
    );
  }

  generateAtHash(accessToken: string, algorithm: string): Observable<string> {
    return this.calcHash(accessToken, algorithm).pipe(
      map((tokenHash) => {
        const substr: string = tokenHash.substr(0, tokenHash.length / 2);
        const tokenHashBase64: string = btoa(substr);

        return tokenHashBase64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      })
    );
  }

  private calcHash(
    valueToHash: string,
    algorithm = 'SHA-256'
  ): Observable<string> {
    const msgBuffer: Uint8Array = new TextEncoder().encode(valueToHash);

    return from(
      this.cryptoService.getCrypto().subtle.digest(algorithm, msgBuffer)
    ).pipe(
      map((hashBuffer: unknown) => {
        const buffer = hashBuffer as ArrayBuffer;
        const hashArray: number[] = Array.from(new Uint8Array(buffer));

        return this.toHashString(hashArray);
      })
    );
  }

  private toHashString(byteArray: number[]): string {
    let result = '';

    for (const e of byteArray) {
      result += String.fromCharCode(e);
    }

    return result;
  }

  private base64UrlEncode(str: string): string {
    const base64: string = btoa(str);

    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}
