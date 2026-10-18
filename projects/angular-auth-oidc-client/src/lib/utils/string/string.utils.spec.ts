import { describe, expect, it } from 'vitest';
import { isString } from './string.utils';

describe('StringUtils', () => {
  describe('isString', () => {
    it('should return true for a string', () => {
      const result = isString('some string');

      expect(result).toBe(true);
    });

    it('should return true for an empty string', () => {
      const result = isString('');

      expect(result).toBe(true);
    });

    it.each([
      ['an object', { some: 'object' }],
      ['an array', ['a', 'b']],
      ['a number', 42],
      ['a boolean', true],
      ['null', null],
      ['undefined', undefined],
      ['an Error', new Error('boom')],
      ['a String object', new String('boxed')],
    ])('should return false for %s', (_description, value) => {
      const result = isString(value);

      expect(result).toBe(false);
    });
  });
});
