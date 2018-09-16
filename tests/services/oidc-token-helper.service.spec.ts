import { TestBed } from '@angular/core/testing';
import { AuthConfiguration, DefaultConfiguration } from '../../src/angular-auth-oidc-client';
import { TokenHelperService } from '../../src/services/oidc-token-helper.service';
import { LoggerService } from '../../src/services/oidc.logger.service';
import { TestLogging } from '../common/test-logging.service';

describe('TokenHelperService', () => {
    let tokenHelperService: TokenHelperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                TokenHelperService,
                { provide: LoggerService, useClass: TestLogging },
                AuthConfiguration,
                DefaultConfiguration,
            ],
        });
    });

    beforeEach(() => {
        tokenHelperService = TestBed.get(TokenHelperService);
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

    describe('getPayloadFromToken', () => {
        it('returns not null if token is undefined, encode is false', () => {
            const result = tokenHelperService.getPayloadFromToken(undefined, false);
            expect(result).toEqual({});
        });

        it('returns not null if token is undefined, encode is true', () => {
            const result = tokenHelperService.getPayloadFromToken(undefined, true);
            expect(result).toEqual({});
        });

        it('returns not null if token is null, encode is true', () => {
            const result = tokenHelperService.getPayloadFromToken(null, true);
            expect(result).toEqual({});
        });

        it('returns not null if token is empty, encode is true', () => {
            const result = tokenHelperService.getPayloadFromToken('', true);
            expect(result).toEqual({});
        });

        it('returns not null if token has no points, encode is true', () => {
            const result = tokenHelperService.getPayloadFromToken('testStringWithoutDots', true);
            expect(result).toEqual({});
        });

        it('returns not null if token has no points, encode is false', () => {
            const result = tokenHelperService.getPayloadFromToken('testStringWithoutDots', false);
            expect(result).toEqual({});
        });

        it('returns not null if token has only one point, encode is false', () => {
            const result = tokenHelperService.getPayloadFromToken('testStringWith.dot', false);
            expect(result).toEqual({});
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'abc.def.ghi';
            const expected = 'def';
            const result = tokenHelperService.getPayloadFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'abc.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.ghi';
            const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const result = tokenHelperService.getPayloadFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is false', () => {
            const token = 'abc.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.ghi';
            const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
            const result = tokenHelperService.getPayloadFromToken(token, false);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is false', () => {
            const token =
                'SGVsbG8gV29ybGQgMTIzIQ==.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==';
            const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
            const result = tokenHelperService.getPayloadFromToken(token, false);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'abc.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.ghi';
            const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const result = tokenHelperService.getPayloadFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token =
                'SGVsbG8gV29ybGQgMTIzIQ==.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==';
            const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const result = tokenHelperService.getPayloadFromToken(token, true);
            expect(expected).toEqual(result);
        });
    });

    describe('getHeaderFromToken', () => {
        it('returns not null if token is undefined, encode is false', () => {
            const result = tokenHelperService.getHeaderFromToken(undefined, false);
            expect(result).toEqual({});
        });

        it('returns not null if token is undefined, encode is true', () => {
            const result = tokenHelperService.getHeaderFromToken(undefined, true);
            expect(result).toEqual({});
        });

        it('returns not null if token is null, encode is true', () => {
            const result = tokenHelperService.getHeaderFromToken(null, true);
            expect(result).toEqual({});
        });

        it('returns not null if token is empty, encode is true', () => {
            const result = tokenHelperService.getHeaderFromToken('', true);
            expect(result).toEqual({});
        });

        it('returns not null if token has no points, encode is true', () => {
            const result = tokenHelperService.getHeaderFromToken('testStringWithoutDots', true);
            expect(result).toEqual({});
        });

        it('returns not null if token has no points, encode is false', () => {
            const result = tokenHelperService.getHeaderFromToken('testStringWithoutDots', false);
            expect(result).toEqual({});
        });

        it('returns not null if token has only one point, encode is false', () => {
            const result = tokenHelperService.getHeaderFromToken('testStringWith.dot', false);
            expect(result).toEqual({});
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'abc.def.ghi';
            const expected = 'abc';
            const result = tokenHelperService.getHeaderFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.def.ghi';
            const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const result = tokenHelperService.getHeaderFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is false', () => {
            const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.def.ghi';
            const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
            const result = tokenHelperService.getHeaderFromToken(token, false);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is false', () => {
            const token =
                'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==';
            const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
            const result = tokenHelperService.getHeaderFromToken(token, false);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.abc.ghi';
            const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const result = tokenHelperService.getHeaderFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token =
                'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==';
            const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const result = tokenHelperService.getHeaderFromToken(token, true);
            expect(expected).toEqual(result);
        });
    });

    describe('getSignatureFromToken', () => {
        it('returns not null if token is undefined, encode is false', () => {
            const result = tokenHelperService.getSignatureFromToken(undefined, false);
            expect(result).toEqual({});
        });

        it('returns not null if token is undefined, encode is true', () => {
            const result = tokenHelperService.getSignatureFromToken(undefined, true);
            expect(result).toEqual({});
        });

        it('returns not null if token is null, encode is true', () => {
            const result = tokenHelperService.getSignatureFromToken(null, true);
            expect(result).toEqual({});
        });

        it('returns not null if token is empty, encode is true', () => {
            const result = tokenHelperService.getSignatureFromToken('', true);
            expect(result).toEqual({});
        });

        it('returns not null if token has no points, encode is true', () => {
            const result = tokenHelperService.getSignatureFromToken('testStringWithoutDots', true);
            expect(result).toEqual({});
        });

        it('returns not null if token has no points, encode is false', () => {
            const result = tokenHelperService.getSignatureFromToken('testStringWithoutDots', false);
            expect(result).toEqual({});
        });

        it('returns not null if token has only one point, encode is false', () => {
            const result = tokenHelperService.getSignatureFromToken('testStringWith.dot', false);
            expect(result).toEqual({});
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'abc.def.ghi';
            const expected = 'ghi';
            const result = tokenHelperService.getSignatureFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'def.ghi.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const expected = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const result = tokenHelperService.getSignatureFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is false', () => {
            const token = 'def.ghi.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
            const result = tokenHelperService.getSignatureFromToken(token, false);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is false', () => {
            const token =
                'SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==.eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9';
            const expected = JSON.parse(`{ "text" : "Hello World 123!"}`);
            const result = tokenHelperService.getSignatureFromToken(token, false);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token = 'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.abc.ghi';
            const expected = 'ghi';
            const result = tokenHelperService.getSignatureFromToken(token, true);
            expect(expected).toEqual(result);
        });

        it('returns payload if token is correct, encode is true', () => {
            const token =
                'eyAidGV4dCIgOiAiSGVsbG8gV29ybGQgMTIzISJ9.SGVsbG8gV29ybGQgMTIzIQ==.SGVsbG8gV29ybGQgMTIzIQ==';
            const expected = 'SGVsbG8gV29ybGQgMTIzIQ==';
            const result = tokenHelperService.getSignatureFromToken(token, true);
            expect(expected).toEqual(result);
        });
    });
});
