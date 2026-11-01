import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { isNetworkError, toError } from './error-helper';

describe('error helper', () => {
  describe('isNetworkError ', () => {
    const HTTP_ERROR = new HttpErrorResponse({});
    const CONNECTION_ERROR = new HttpErrorResponse({
      error: new ProgressEvent('error'),
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://identity-server.test/openid-connect/token',
    });
    const UNKNOWN_CONNECTION_ERROR = new HttpErrorResponse({
      error: new Error('error'),
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://identity-server.test/openid-connect/token',
    });
    const PARTIAL_CONNECTION_ERROR = new HttpErrorResponse({
      error: new ProgressEvent('error'),
      status: 418, // i am a teapot
      statusText: 'Unknown Error',
      url: 'https://identity-server.test/openid-connect/token',
    });

    it('should return true on http error with status = 0', () => {
      expect(isNetworkError(CONNECTION_ERROR)).toBe(true);
    });

    it('should return true on http error with status = 0 and unknown error', () => {
      expect(isNetworkError(UNKNOWN_CONNECTION_ERROR)).toBe(true);
    });

    it('should return true on http error with status <> 0 and error ProgressEvent', () => {
      expect(isNetworkError(PARTIAL_CONNECTION_ERROR)).toBe(true);
    });

    it('should return false on non http error', () => {
      expect(isNetworkError(new Error('not a HttpErrorResponse'))).toBe(false);
    });

    it('should return false on string error', () => {
      expect(isNetworkError('not a HttpErrorResponse')).toBe(false);
    });

    it('should return false on undefined', () => {
      expect(isNetworkError(undefined)).toBe(false);
    });

    it('should return false on empty http error', () => {
      expect(isNetworkError(HTTP_ERROR)).toBe(false);
    });
  });

  describe('toError', () => {
    const ERROR = new Error('refresh failed');
    const WELL_KNOWN_HTTP_ERROR = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: 'https://identity-server.test/.well-known/openid-configuration',
    });

    it('should return the same instance when the value is an Error', () => {
      // Act
      const result = toError(ERROR);

      // Assert
      expect(result).toBe(ERROR);
    });

    it('should wrap an HttpErrorResponse in an Error with its message and keep it as cause', () => {
      // Act
      const result = toError(WELL_KNOWN_HTTP_ERROR);

      // Assert
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe(WELL_KNOWN_HTTP_ERROR.message);
      expect(result.cause).toBe(WELL_KNOWN_HTTP_ERROR);
    });

    it('should wrap a string in an Error with the string as message', () => {
      // Act
      const result = toError('login_required');

      // Assert
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('login_required');
      expect(result.cause).toBe('login_required');
    });

    it('should wrap undefined in an Error with a default message', () => {
      // Act
      const result = toError(undefined);

      // Assert
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown error');
    });

    it('should wrap any other value in an Error with the stringified value as message', () => {
      // Act
      const result = toError(42);

      // Assert
      expect(result.message).toBe('42');
      expect(result.cause).toBe(42);
    });
  });
});
