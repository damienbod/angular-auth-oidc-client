import { Injectable } from '@angular/core';

@Injectable()
export class JwkExtractor {
  extractJwk(keys: JsonWebKey[], keyId?: string, use?: string): JsonWebKey {
    const isNil = (c: any): boolean => {
      return null === c || undefined === c;
    };

    if (0 === keys.length) {
      throw new Error('Array of JsonWebKey was empty. Unable to extract');
    }

    let foundKeys = [...keys];

    if (!isNil(keyId)) {
      foundKeys = foundKeys.filter((k) => k['kid'] === keyId);
    }

    if (!isNil(use)) {
      foundKeys = foundKeys.filter((k) => k['use'] === use);
    }

    if (foundKeys.length === 0) {
      throw new Error(`No JsonWebKey found`);
    }

    if (foundKeys.length > 1 && isNil(keyId) && isNil(use)) {
      throw new Error(`More than one JsonWebKey found`);
    }

    return foundKeys[0];
  }
}
