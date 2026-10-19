import { describe, expect, it } from 'vitest';
import { asError } from './as-error';

describe('asError', () => {
  it('should return an Error unchanged', () => {
    // Arrange
    const error = new TypeError('broken');

    // Act & Assert
    expect(asError(error)).toBe(error);
  });

  it('should wrap a string into an Error with that message', () => {
    // Act
    const result = asError('broken');

    // Assert
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('broken');
  });

  it('should wrap any other value like the Error constructor does', () => {
    // Arrange
    const value = { status: 500 };

    // Act & Assert
    expect(asError(value).message).toBe(new Error(value as any).message);
  });
});
