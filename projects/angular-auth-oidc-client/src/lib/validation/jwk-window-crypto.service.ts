import { Injectable } from '@angular/core';
import { CryptoService } from '../utils/crypto/crypto.service';

@Injectable({ providedIn: 'root' })
export class JwkWindowCryptoService {
  constructor(private readonly cryptoService: CryptoService) {}

  importVerificationKey(
    key: JsonWebKey,
    algorithm:
      | AlgorithmIdentifier
      | RsaHashedImportParams
      | EcKeyImportParams
      | HmacImportParams
      | AesKeyAlgorithm
      | null
  ): Promise<CryptoKey> {
    return this.cryptoService
      .getCrypto()
      .subtle.importKey('jwk', key, algorithm, false, ['verify']);
  }

  verifyKey(
    verifyAlgorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams | null,
    cryptoKey: CryptoKey,
    signature: BufferSource,
    signingInput: string
  ): Promise<boolean> {
    return this.cryptoService
      .getCrypto()
      .subtle.verify(
        verifyAlgorithm,
        cryptoKey,
        signature,
        new TextEncoder().encode(signingInput)
      );
  }
}
