import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../../test/auto-mock';
import { AbstractLoggerService } from '../../logging/abstract-logger.service';
import { LoggerService } from '../../logging/logger.service';
import { TokenHelperService } from './token-helper.service';

describe('Token Helper Service', () => {
  let tokenHelperService: TokenHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenHelperService, { provide: AbstractLoggerService, useClass: mockClass(LoggerService) }],
    });
  });

  beforeEach(() => {
    tokenHelperService = TestBed.inject(TokenHelperService);
  });

  it('should create', () => {
    expect(tokenHelperService).toBeTruthy();
  });

  describe('getTokenExpirationDate', () => {
    it('returns not null if param has no property exp', () => {
      const result = tokenHelperService.getTokenExpirationDate({});
      expect(result).toBeDefined();
    });

    it('returns date if param has no property exp', () => {
      const result = tokenHelperService.getTokenExpirationDate({});
      expect(result instanceof Date).toBe(true);
    });

    it('returns correct date if param has property exp', () => {
      const expectedDate = new Date(0);
      expectedDate.setUTCSeconds(123);

      const result = tokenHelperService.getTokenExpirationDate({
        exp: 123,
      });
      expect(expectedDate.toString()).toEqual(result.toString());
    });
  });

  describe('getSigningInputFromToken', () => {
    it('returns empty string if token is not valid', () => {
      const result = tokenHelperService.getSigningInputFromToken('', true, { configId: 'configId1' });

      expect(result).toBe('');
    });

    it('returns string if token is valid', () => {
      const token = 'a.valid.token';
      const result = tokenHelperService.getSigningInputFromToken(token, true, { configId: 'configId1' });

      expect(result).toBe('a.valid');
    });
  });

  describe('getPayloadFromToken', () => {
    it('returns not null if token is undefined, encode is false', () => {
      const result = tokenHelperService.getPayloadFromToken(undefined, false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is undefined, encode is true', () => {
      const result = tokenHelperService.getPayloadFromToken(undefined, true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is null, encode is true', () => {
      const result = tokenHelperService.getPayloadFromToken(null, true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is empty, encode is true', () => {
      const result = tokenHelperService.getPayloadFromToken('', true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has no points, encode is true', () => {
      const result = tokenHelperService.getPayloadFromToken('testStringWithoutDots', true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has no points, encode is false', () => {
      const result = tokenHelperService.getPayloadFromToken('testStringWithoutDots', false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has only one point, encode is false', () => {
      const result = tokenHelperService.getPayloadFromToken('testStringWith.dot', false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns payload if token is correct, encode is true 1', () => {
      const token = 'abc.def.ghi';
      const expected = 'def';
      const result = tokenHelperService.getPayloadFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true 2', () => {
      const token = 'abc.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.ghi';
      const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const result = tokenHelperService.getPayloadFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true 3', () => {
      const token = 'abc.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.ghi';
      const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const result = tokenHelperService.getPayloadFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true 4', () => {
      const token = 'SGVsbG8gV29ybGQgMTIzIQ==.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==';
      const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const result = tokenHelperService.getPayloadFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false 1', () => {
      const token = 'abc.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.ghi';
      const expected = JSON.parse('{ "text" : "Hello World 123!"}');
      const result = tokenHelperService.getPayloadFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false 2', () => {
      const token = 'SGVsbG8gV29ybGQgMTIzIQ==.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==';
      const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
      const result = tokenHelperService.getPayloadFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false 3', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiBEw7PDqyJ9.wMn-1oLWnxKJolMGb7YKnlwjqusWf4xnnjABgFaDkI4';
      const jsonString = `{ "name" : "John D\xF3\xEB" }`;
      const expected = JSON.parse(jsonString);
      const result = tokenHelperService.getPayloadFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false 4', () => {
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
        '.eyJzdWIiOiIxIiwibmFtZSI6IkpvaG4gRF83NDc377-977-9MDEiLCJhZG1pbiI6dHJ1ZSwiaWF0IjoxNTE2MjI0MjQyfQ' +
        '.RqIi_sO2g592anknIvfks4p7kPy8mOcN0YZUHz-8pFw';

      const jsonString = `{ "admin": true, "sub": "1", "iat": 1516224242 }`;
      const expected = JSON.parse(jsonString);
      const result = tokenHelperService.getPayloadFromToken(token, false, { configId: 'configId1' });

      expect(result).toEqual(jasmine.objectContaining(expected));
    });
  });

  describe('getHeaderFromToken', () => {
    it('returns not null if token is undefined, encode is false', () => {
      const result = tokenHelperService.getHeaderFromToken(undefined, false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is undefined, encode is true', () => {
      const result = tokenHelperService.getHeaderFromToken(undefined, true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is null, encode is true', () => {
      const result = tokenHelperService.getHeaderFromToken(null, true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is empty, encode is true', () => {
      const result = tokenHelperService.getHeaderFromToken('', true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has no points, encode is true', () => {
      const result = tokenHelperService.getHeaderFromToken('testStringWithoutDots', true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has no points, encode is false', () => {
      const result = tokenHelperService.getHeaderFromToken('testStringWithoutDots', false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has only one point, encode is false', () => {
      const result = tokenHelperService.getHeaderFromToken('testStringWith.dot', false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'abc.def.ghi';
      const expected = 'abc';
      const result = tokenHelperService.getHeaderFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.def.ghi';
      const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const result = tokenHelperService.getHeaderFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false', () => {
      const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.def.ghi';
      const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
      const result = tokenHelperService.getHeaderFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false', () => {
      const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==';
      const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
      const result = tokenHelperService.getHeaderFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.abc.ghi';
      const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const result = tokenHelperService.getHeaderFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==';
      const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const result = tokenHelperService.getHeaderFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false', () => {
      const token = 'eyJ0ZXh0IjogIkhlbGxvIFdvcmxkIDEyMyEifQ=.SGVsbG8gV29ybGQgMTIzIQ==.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const expected = JSON.parse(`{"text": "Hello World 123!"}`);
      const result = tokenHelperService.getHeaderFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });
  });

  describe('getSignatureFromToken', () => {
    it('returns not null if token is undefined, encode is false', () => {
      const result = tokenHelperService.getSignatureFromToken(undefined, false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is undefined, encode is true', () => {
      const result = tokenHelperService.getSignatureFromToken(undefined, true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is null, encode is true', () => {
      const result = tokenHelperService.getSignatureFromToken(null, true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token is empty, encode is true', () => {
      const result = tokenHelperService.getSignatureFromToken('', true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has no points, encode is true', () => {
      const result = tokenHelperService.getSignatureFromToken('testStringWithoutDots', true, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has no points, encode is false', () => {
      const result = tokenHelperService.getSignatureFromToken('testStringWithoutDots', false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns not null if token has only one point, encode is false', () => {
      const result = tokenHelperService.getSignatureFromToken('testStringWith.dot', false, { configId: 'configId1' });
      expect(result).toEqual({});
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'abc.def.ghi';
      const expected = 'ghi';
      const result = tokenHelperService.getSignatureFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'def.ghi.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const result = tokenHelperService.getSignatureFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false', () => {
      const token = 'def.ghi.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
      const result = tokenHelperService.getSignatureFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is false', () => {
      const token = 'SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
      const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
      const result = tokenHelperService.getSignatureFromToken(token, false, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.abc.ghi';
      const expected = 'ghi';
      const result = tokenHelperService.getSignatureFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });

    it('returns payload if token is correct, encode is true', () => {
      const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==';
      const expected = 'SGVsbG8gV29ybGQgMTIzIQ==';
      const result = tokenHelperService.getSignatureFromToken(token, true, { configId: 'configId1' });
      expect(expected).toEqual(result);
    });
  });
});
