import { Injectable } from '@angular/core';

@Injectable()
export class JwkExtractor {
  extractJwk(keys: JsonWebKey[], keyId?: string): JsonWebKey {
    if (0 === keys.length) {
      throw new Error('Array of JsonWebKey was empty. Unable to extract');
    }

    if (1 === keys.length && (null === keyId || undefined === keyId)) {
      return keys[0];
    }

    const foundKeys = keys.filter((k) => k['kid'] === keyId);

    if (foundKeys.length === 0) {
      throw new Error(`No JsonWebKey found matching provided kid (${keyId})`);
    }

    if (foundKeys.length > 1) {
      throw new Error(`More than one JsonWebKey found matching provided kid (${keyId})`);
    }

    return foundKeys[0];
  }
}
