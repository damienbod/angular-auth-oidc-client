import { describe, expect, it } from 'vitest';
import { asError } from './as-error';

describe('asError', () => {
  it('returns an Error unchanged', () => {
    const error = new TypeError('broken');

    expect(asError(error)).toBe(error);
  });

  it('wraps a string into an Error with that message', () => {
    const result = asError('broken');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('broken');
  });

  it('wraps any other value like the Error constructor does', () => {
    expect(asError({ status: 500 }).message).toBe(
      new Error({ status: 500 } as any).message
    );
  });
});
