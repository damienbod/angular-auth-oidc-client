import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class JwtWindowCryptoService {
  private crypto: Crypto = window.crypto || (window as any).msCrypto; // for IE11

  generateCodeChallenge(codeVerifier: string): Observable<string> {
    return this.calcHash(codeVerifier).pipe(map((challengeRaw: string) => base64UrlEncode(challengeRaw)));
  }

  generateAtHash(accessToken: string, algorithm: string): Observable<string> {
    return this.calcHash(accessToken, algorithm).pipe(
      map((tokenHash) => {
        let substr: string = tokenHash.substr(0, tokenHash.length / 2);
        const tokenHashBase64: string = btoa(substr);

        return tokenHashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      })
    );
  }

  private calcHash(valueToHash: string, algorithm: string = 'SHA-256'): Observable<string> {
    const msgBuffer: Uint8Array = new TextEncoder().encode(valueToHash);

    return from(this.crypto.subtle.digest(algorithm, msgBuffer)).pipe(
      map((hashBuffer: ArrayBuffer) => {
        const hashArray: number[] = Array.from(new Uint8Array(hashBuffer));

        return this.toHashString(hashArray);
      })
    );
  }

  private toHashString(byteArray: number[]): string {
    let result = '';
    for (let e of byteArray) {
      result += String.fromCharCode(e);
    }

    return result;
  }
}

export function base64UrlEncode(str): string {
  const base64: string = btoa(str);

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
