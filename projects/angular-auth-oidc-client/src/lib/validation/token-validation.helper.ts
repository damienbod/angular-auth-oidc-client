export function getVerifyAlg(
  alg: string
): RsaHashedImportParams | EcdsaParams | Algorithm | null {
  switch (alg.charAt(0)) {
    case 'R':
      return {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      };
    case 'E':
      if (isEd25519Alg(alg)) {
        return { name: 'Ed25519' };
      }
      if (alg.includes('256')) {
        return {
          name: 'ECDSA',
          hash: 'SHA-256',
        };
      } else if (alg.includes('384')) {
        return {
          name: 'ECDSA',
          hash: 'SHA-384',
        };
      } else {
        return null;
      }
    default:
      return null;
  }
}

export function alg2kty(alg: string): string {
  switch (alg.charAt(0)) {
    case 'R':
      return 'RSA';

    case 'E':
      if (isEd25519Alg(alg)) {
        return 'OKP';
      } else {
        return 'EC';
      }

    default:
      throw new Error('Cannot infer kty from alg: ' + alg);
  }
}

export function getImportAlg(
  alg: string
): RsaHashedImportParams | EcKeyImportParams | Algorithm | null {
  switch (alg.charAt(0)) {
    case 'R':
      if (alg.includes('256')) {
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        };
      } else if (alg.includes('384')) {
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-384',
        };
      } else if (alg.includes('512')) {
        return {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-512',
        };
      } else {
        return null;
      }
    case 'E':
      if (isEd25519Alg(alg)) {
        return { name: 'Ed25519' };
      }
      if (alg.includes('256')) {
        return {
          name: 'ECDSA',
          namedCurve: 'P-256',
        };
      } else if (alg.includes('384')) {
        return {
          name: 'ECDSA',
          namedCurve: 'P-384',
        };
      } else {
        return null;
      }
    default:
      return null;
  }
}

// 'EdDSA' (RFC 8037) and the fully-specified 'Ed25519' (RFC 9864)
export function isEd25519Alg(alg: string): boolean {
  return alg === 'EdDSA' || alg === 'Ed25519';
}
