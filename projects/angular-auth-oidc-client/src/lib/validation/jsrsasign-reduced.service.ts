import { Injectable } from '@angular/core';
import { hextob64u, KJUR } from 'jsrsasign-reduced';

@Injectable()
export class JsrsAsignReducedService {
  generateCodeChallenge(codeVerifier: any): string {
    const hash = KJUR.crypto.Util.hashString(codeVerifier, 'sha256');
    const testData = hextob64u(hash);

    return testData;
  }

  generateAtHash(accessToken: any, sha: string): string {
    const hash = KJUR.crypto.Util.hashString(accessToken, sha);
    const first128bits = hash.substr(0, hash.length / 2);
    const testData = hextob64u(first128bits);

    return testData;
  }
}
