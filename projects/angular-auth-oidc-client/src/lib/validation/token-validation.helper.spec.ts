import { describe, expect, it } from 'vitest';
import { alg2kty, getImportAlg, getVerifyAlg } from './token-validation.helper';

describe('getVerifyAlg', () => {
  it('returns null if char has no E or R', () => {
    const algorithm = 'ASDFGT';
    const result = getVerifyAlg(algorithm);

    expect(result).toBe(null);
  });

  it('returns correct result when algorithm is R', () => {
    const algorithm = 'R';
    const result = getVerifyAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    });
  });

  it('returns null if algorithm is only E', () => {
    const algorithm = 'E';
    const result = getVerifyAlg(algorithm);

    expect(result).toBe(null);
  });

  it('returns correct result if algorithm is E256', () => {
    const algorithm = 'E256';
    const result = getVerifyAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      hash: 'SHA-256',
    });
  });

  it('returns correct result if algorithm is E384', () => {
    const algorithm = 'E384';
    const result = getVerifyAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      hash: 'SHA-384',
    });
  });
});

describe('getVerifyAlg for RSA-PSS', () => {
  it.each([
    ['PS256', 32],
    ['PS384', 48],
    ['PS512', 64],
  ])(
    'returns RSA-PSS with the hash size as salt length for %s',
    (alg, saltLength) => {
      expect(getVerifyAlg(alg)).toEqual({ name: 'RSA-PSS', saltLength });
    }
  );

  it('returns null if algorithm is only P', () => {
    expect(getVerifyAlg('P')).toBe(null);
  });
});

describe('alg2kty', () => {
  it('returns RSA if algorithm is P', () => {
    expect(alg2kty('PS256')).toEqual('RSA');
  });

  it('returns correct result if algorithm is R', () => {
    const algorithm = 'R';
    const result = alg2kty(algorithm);

    expect(result).toEqual('RSA');
  });

  it('returns correct result if algorithm is E', () => {
    const algorithm = 'E';
    const result = alg2kty(algorithm);

    expect(result).toEqual('EC');
  });

  it('throws if algorithm is neither R nor E', () => {
    const algorithm = 'SOMETHING_ELSE';

    expect(() => alg2kty(algorithm)).toThrow(
      new Error('Cannot infer kty from alg: SOMETHING_ELSE')
    );
  });
});

describe('getImportAlg', () => {
  it('returns null if algorithm is not R or E', () => {
    const algorithm = 'Q';
    const result = getImportAlg(algorithm);

    expect(result).toBe(null);
  });

  it('returns null if algorithm is only R', () => {
    const algorithm = 'R';
    const result = getImportAlg(algorithm);

    expect(result).toBe(null);
  });

  it('returns correct result if algorithm is R256', () => {
    const algorithm = 'R256';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    });
  });

  it('returns correct result if algorithm is R384', () => {
    const algorithm = 'R384';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-384',
    });
  });

  it('returns correct result if algorithm is R512', () => {
    const algorithm = 'R512';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-512',
    });
  });

  it('returns null if algorithm is only E', () => {
    const algorithm = 'E';
    const result = getImportAlg(algorithm);

    expect(result).toBe(null);
  });

  it('returns correct result if algorithm is E256', () => {
    const algorithm = 'E256';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      namedCurve: 'P-256',
    });
  });

  it('returns correct result if algorithm is E384', () => {
    const algorithm = 'E384';
    const result = getImportAlg(algorithm);

    expect(result).toEqual({
      name: 'ECDSA',
      namedCurve: 'P-384',
    });
  });
});

describe('getImportAlg for RSA-PSS', () => {
  it.each([
    ['PS256', 'SHA-256'],
    ['PS384', 'SHA-384'],
    ['PS512', 'SHA-512'],
  ])('returns RSA-PSS with %s hash', (alg, hash) => {
    expect(getImportAlg(alg)).toEqual({ name: 'RSA-PSS', hash });
  });
});
