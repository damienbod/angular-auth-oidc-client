import { Injectable } from '@angular/core';

@Injectable()
export class JsrsAsignReducedService {
  private crypto: Crypto = window.crypto || (window as any).msCrypto; // for IE11
  private textEncoder: TextEncoder = new TextEncoder();
  private textDecoder: TextDecoder = new TextDecoder();

  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const challengeRaw: string = await this.calcHash(codeVerifier);

    return base64UrlEncode(challengeRaw);
  }

  async generateAtHash(accessToken: string, algorithm: string): Promise<string> {
    const valueAsBytes: Uint8Array = this.textEncoder.encode(accessToken);
    const resultBytes: ArrayBuffer = await this.crypto.subtle.digest(algorithm, valueAsBytes);

    return btoa(encodeURIComponent(this.textDecoder.decode(resultBytes)));
  }

  async calcHash(valueToHash: string): Promise<string> {
    const msgBuffer: Uint8Array = new TextEncoder().encode(valueToHash);
    const hashBuffer: ArrayBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    const hashArray: number[] = Array.from(new Uint8Array(hashBuffer));

    return this.toHashString(hashArray);
  }

  toHashString(byteArray: number[]): string {
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
