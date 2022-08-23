import { Injectable } from '@angular/core';

@Injectable()
export class JwkExtractor {
  static InvalidArgumentError = {
    name: JwkExtractor.buildErrorName('InvalidArgumentError'),
    message: 'Array of keys was empty. Unable to extract'
  };

  static NoMatchingKeysError = {
    name: JwkExtractor.buildErrorName('NoMatchingKeysError'),
    message: 'No key found matching the spec'
  };

  static SeveralMatchingKeysError = {
    name: JwkExtractor.buildErrorName('SeveralMatchingKeysError'),
    message: 'More than one key found. Please use spec to filter'
  };

  private static buildErrorName(name: string): string {
    return JwkExtractor.name + ': ' + name;
  }

  extractJwk(keys: JsonWebKey[], spec?: {kid?: string, use?: string, kty?: string}): JsonWebKey {
    if (0 === keys.length) {
      throw JwkExtractor.InvalidArgumentError;
    }

    let foundKeys = keys
      .filter((k) => spec?.kid ? k['kid'] === spec.kid : true)
      .filter((k) => spec?.use ? k['use'] === spec.use : true)
      .filter((k) => spec?.kty ? k['kty'] === spec.kty : true);

    if (foundKeys.length === 0) {
      throw JwkExtractor.NoMatchingKeysError;
    }

    if (foundKeys.length > 1 && (null === spec || undefined === spec)) {
      throw JwkExtractor.SeveralMatchingKeysError;
    }

    return foundKeys[0];
  }
}
