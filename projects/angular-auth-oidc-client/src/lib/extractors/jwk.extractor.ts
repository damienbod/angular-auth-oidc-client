import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JwkExtractor {
  extractJwk(
    keys: JsonWebKey[],
    spec?: { kid?: string; use?: string; kty?: string },
    throwOnEmpty = true
  ): JsonWebKey[] {
    if (0 === keys.length) {
      throw JwkExtractorInvalidArgumentError;
    }

    const foundKeys = keys
      .filter((k) => (spec?.kid ? k['kid'] === spec.kid : true))
      .filter((k) => (spec?.use ? k['use'] === spec.use : true))
      .filter((k) => (spec?.kty ? k['kty'] === spec.kty : true));

    if (foundKeys.length === 0 && throwOnEmpty) {
      throw JwkExtractorNoMatchingKeysError;
    }

    if (foundKeys.length > 1 && (null === spec || undefined === spec)) {
      throw JwkExtractorSeveralMatchingKeysError;
    }

    return foundKeys;
  }
}

function buildErrorName(name: string): string {
  return JwkExtractor.name + ': ' + name;
}

export const JwkExtractorInvalidArgumentError = {
  name: buildErrorName('InvalidArgumentError'),
  message: 'Array of keys was empty. Unable to extract',
};

export const JwkExtractorNoMatchingKeysError = {
  name: buildErrorName('NoMatchingKeysError'),
  message: 'No key found matching the spec',
};

export const JwkExtractorSeveralMatchingKeysError = {
  name: buildErrorName('SeveralMatchingKeysError'),
  message: 'More than one key found. Please use spec to filter',
};
