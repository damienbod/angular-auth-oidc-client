import { Injectable } from '@angular/core';
import { CryptoService } from '../utils/crypto/crypto-service';

@Injectable()
export class JwkWindowCryptoService {
  constructor(private readonly cryptoService: CryptoService) {}

  importVerificationKey(key: JsonWebKey, algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm): Promise<CryptoKey> {
    return this.cryptoService.getCrypto().subtle.importKey('jwk', key, algorithm, false, ['verify']);
  }

  verifyKey(verifyAlgorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams, cryptoKey: CryptoKey, signature: BufferSource, signingInput: string): Promise<boolean> {
    return this.cryptoService.getCrypto().subtle.verify(verifyAlgorithm, cryptoKey, signature, new TextEncoder().encode(signingInput))
  }
}
