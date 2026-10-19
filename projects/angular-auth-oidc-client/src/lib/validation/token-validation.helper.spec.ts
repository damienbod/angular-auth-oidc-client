import { describe, expect, it } from 'vitest';
import { alg2kty, getImportAlg, getVerifyAlg } from './token-validation.helper';

describe('getVerifyAlg', () => {
  it('should return null if char has no E or R', () => {
    const algorithm = 'ASDFGT';
    const result = getVerifyAlg(algorithm);

    expect(result).toBe(null);
  });

  it('should return correct result when algorithm is R', () => {
    const algorithm = 'R';
    const result = getVerifyAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    });
  });

  it('should return null if algorithm is only E', () => {
    const algorithm = 'E';
    const result = getVerifyAlg(algorithm);

    expect(result).toBe(null);
  });

  it('should return correct result if algorithm is E256', () => {
    const algorithm = 'E256';
    const result = getVerifyAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      hash: 'SHA-256',
    });
  });

  it('should return correct result if algorithm is E384', () => {
    const algorithm = 'E384';
    const result = getVerifyAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      hash: 'SHA-384',
    });
  });

  it.each(['EdDSA', 'Ed25519'])(
    'should return Ed25519 if algorithm is %s',
    (alg) => {
      // Act
      const result = getVerifyAlg(alg);

      // Assert
      expect(result).toEqual({ name: 'Ed25519' });
    }
  );

  it('should keep the ECDSA mapping for ES256', () => {
    // Act
    const result = getVerifyAlg('ES256');

    // Assert
    expect(result).toEqual({ name: 'ECDSA', hash: 'SHA-256' });
  });
});

describe('getVerifyAlg for RSA-PSS', () => {
  it.each([
    ['PS256', 32],
    ['PS384', 48],
    ['PS512', 64],
  ])(
    'should return RSA-PSS with the hash size as salt length for %s',
    (alg, saltLength) => {
      expect(getVerifyAlg(alg)).toEqual({ name: 'RSA-PSS', saltLength });
    }
  );

  it('should return null if algorithm is only P', () => {
    expect(getVerifyAlg('P')).toBe(null);
  });
});

describe('alg2kty', () => {
  it('should return RSA if algorithm is P', () => {
    expect(alg2kty('PS256')).toEqual('RSA');
  });

  it('should return correct result if algorithm is R', () => {
    const algorithm = 'R';
    const result = alg2kty(algorithm);

    expect(result).toEqual('RSA');
  });

  it('should return correct result if algorithm is E', () => {
    const algorithm = 'E';
    const result = alg2kty(algorithm);

    expect(result).toEqual('EC');
  });

  it.each(['EdDSA', 'Ed25519'])(
    'should return OKP if algorithm is %s',
    (alg) => {
      // Act
      const result = alg2kty(alg);

      // Assert
      expect(result).toEqual('OKP');
    }
  );

  it.each(['ES256', 'ES384'])('should keep EC for %s', (alg) => {
    // Act
    const result = alg2kty(alg);

    // Assert
    expect(result).toEqual('EC');
  });

  it('should throw if algorithm is neither R nor E', () => {
    const algorithm = 'SOMETHING_ELSE';

    expect(() => alg2kty(algorithm)).toThrow(
      new Error('Cannot infer kty from alg: SOMETHING_ELSE')
    );
  });
});

describe('getImportAlg', () => {
  it('should return null if algorithm is not R or E', () => {
    const algorithm = 'Q';
    const result = getImportAlg(algorithm);

    expect(result).toBe(null);
  });

  it('should return null if algorithm is only R', () => {
    const algorithm = 'R';
    const result = getImportAlg(algorithm);

    expect(result).toBe(null);
  });

  it('should return correct result if algorithm is R256', () => {
    const algorithm = 'R256';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    });
  });

  it('should return correct result if algorithm is R384', () => {
    const algorithm = 'R384';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-384',
    });
  });

  it('should return correct result if algorithm is R512', () => {
    const algorithm = 'R512';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-512',
    });
  });

  it('should return null if algorithm is only E', () => {
    const algorithm = 'E';
    const result = getImportAlg(algorithm);

    expect(result).toBe(null);
  });

  it('should return correct result if algorithm is E256', () => {
    const algorithm = 'E256';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      namedCurve: 'P-256',
    });
  });

  it('should return correct result if algorithm is E384', () => {
    const algorithm = 'E384';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      namedCurve: 'P-384',
    });
  });

  it.each(['EdDSA', 'Ed25519'])(
    'should return Ed25519 if algorithm is %s',
    (alg) => {
      // Act
      const result = getImportAlg(alg);

      // Assert
      expect(result).toEqual({ name: 'Ed25519' });
    }
  );

  it('should keep the ECDSA mapping for ES256', () => {
    // Act
    const result = getImportAlg('ES256');

    // Assert
    expect(result).toEqual({ name: 'ECDSA', namedCurve: 'P-256' });
  });
});

describe('getImportAlg for RSA-PSS', () => {
  it.each([
    ['PS256', 'SHA-256'],
    ['PS384', 'SHA-384'],
    ['PS512', 'SHA-512'],
  ])('should return RSA-PSS with %s hash', (alg, hash) => {
    expect(getImportAlg(alg)).toEqual({ name: 'RSA-PSS', hash });
  });
});
