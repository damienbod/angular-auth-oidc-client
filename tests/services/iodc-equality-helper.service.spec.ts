import { TestBed } from '@angular/core/testing';
import { EqualityHelperService } from '../../src/services/oidc-equality-helper.service';

describe('EqualityHelperServiceTests', () => {
    let equalityHelperService: EqualityHelperService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EqualityHelperService],
        });
    });

    beforeEach(() => {
        equalityHelperService = TestBed.get(EqualityHelperService);
    });

    it('should create', () => {
        expect(equalityHelperService).toBeTruthy();
    });

    it('first arg is null returns false', () => {
        const result = equalityHelperService.areEqual(null, 'somestring');
        expect(result).toBe(false);
    });

    it('second arg is null returns false', () => {
        const result = equalityHelperService.areEqual('somestring', null);
        expect(result).toBe(false);
    });

    it('first arg is undefined returns false', () => {
        const result = equalityHelperService.areEqual(undefined, 'somestring');
        expect(result).toBe(false);
    });

    it('second arg is undefined returns false', () => {
        const result = equalityHelperService.areEqual('somestring', undefined);
        expect(result).toBe(false);
    });

    it('two empty strings return false', () => {
        const result = equalityHelperService.areEqual('', '');
        expect(result).toBe(false);
    });

    it('two equal strings return true', () => {
        const result = equalityHelperService.areEqual(
            'somestring',
            'somestring'
        );
        expect(result).toBe(true);
    });

    it('two equal strings but different casing returns false', () => {
        const result = equalityHelperService.areEqual(
            'somestring',
            'Somestring'
        );
        expect(result).toBe(false);
    });

    it('two same arrays return true', () => {
        const array1 = ['somestring1', 'somestring2'];
        const array2 = ['somestring1', 'somestring2'];
        const result = equalityHelperService.areEqual(array1, array2);
        expect(result).toBe(true);
    });

    it('two same arrays (bit not casing) return false', () => {
        const array1 = ['somestring1', 'SOMESTRING2'];
        const array2 = ['somestring1', 'somestring2'];
        const result = equalityHelperService.areEqual(array1, array2);
        expect(result).toBe(false);
    });

    it('two different arrays return false', () => {
        const array1 = ['somestring1'];
        const array2 = ['somestring1', 'somestring2'];
        const result = equalityHelperService.areEqual(array1, array2);
        expect(result).toBe(false);
    });

    it('two same objects return true', () => {
        const object1 = { name: 'Phil', age: 67 };
        const object2 = { name: 'Phil', age: 67 };
        const result = equalityHelperService.areEqual(object1, object2);
        expect(result).toBe(true);
    });

    it('two different objects return false', () => {
        const object1 = { name: 'Phil', age: 67 };
        const object2 = { name: 'Mike', age: 67 };
        const result = equalityHelperService.areEqual(object1, object2);
        expect(result).toBe(false);
    });

    it('string and array (same) return true', () => {
        const array1 = ['somestring1'];
        const string2 = 'somestring1';
        const result = equalityHelperService.areEqual(array1, string2);
        expect(result).toBe(true);
    });

    it('array and string (same) return true', () => {
        const array1 = ['somestring1'];
        const string2 = 'somestring1';
        const result = equalityHelperService.areEqual(string2, array1);
        expect(result).toBe(true);
    });

    it('string and array (different) return false', () => {
        const array1 = ['somestring'];
        const string2 = 'somestring1';
        const result = equalityHelperService.areEqual(string2, array1);
        expect(result).toBe(false);
    });

    it('array and string (same) return true', () => {
        const array1 = ['somestring1'];
        const string2 = 'somestring';
        const result = equalityHelperService.areEqual(array1, string2);
        expect(result).toBe(false);
    });
});
