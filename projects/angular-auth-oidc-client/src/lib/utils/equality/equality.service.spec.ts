import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { IFrameService } from '../../iframe/existing-iframe.service';
import { EqualityService } from './equality.service';

describe('EqualityService Tests', () => {
  let equalityHelperService: EqualityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EqualityService, IFrameService],
    });
  });

  beforeEach(() => {
    equalityHelperService = TestBed.inject(EqualityService);
  });

  it('should create', () => {
    expect(equalityHelperService).toBeTruthy();
  });

  describe('areEqual', () => {
    it('should return false when the first arg is null', () => {
      const result = equalityHelperService.areEqual(null, 'somestring');

      expect(result).toBe(false);
    });

    it('should return false when the second arg is null', () => {
      const result = equalityHelperService.areEqual('somestring', null);

      expect(result).toBe(false);
    });

    it('should return false when the first arg is undefined', () => {
      const result = equalityHelperService.areEqual(undefined, 'somestring');

      expect(result).toBe(false);
    });

    it('should return false when the second arg is undefined', () => {
      const result = equalityHelperService.areEqual('somestring', undefined);

      expect(result).toBe(false);
    });

    it('should return false for two empty strings', () => {
      const result = equalityHelperService.areEqual('', '');

      expect(result).toBe(false);
    });

    it('should return true for two equal strings', () => {
      const result = equalityHelperService.areEqual('somestring', 'somestring');

      expect(result).toBe(true);
    });

    it('should return false for two equal strings with different casing', () => {
      const result = equalityHelperService.areEqual('somestring', 'Somestring');

      expect(result).toBe(false);
    });

    it('should return true for two same arrays', () => {
      const array1 = ['somestring1', 'somestring2'];
      const array2 = ['somestring1', 'somestring2'];
      const result = equalityHelperService.areEqual(array1, array2);

      expect(result).toBe(true);
    });

    it('should return false for two same arrays with different casing', () => {
      const array1 = ['somestring1', 'SOMESTRING2'];
      const array2 = ['somestring1', 'somestring2'];
      const result = equalityHelperService.areEqual(array1, array2);

      expect(result).toBe(false);
    });

    it('should return false for two different arrays', () => {
      const array1 = ['somestring1'];
      const array2 = ['somestring1', 'somestring2'];
      const result = equalityHelperService.areEqual(array1, array2);

      expect(result).toBe(false);
    });

    it('should return true for two same objects', () => {
      const object1 = { name: 'Phil', age: 67 };
      const object2 = { name: 'Phil', age: 67 };
      const result = equalityHelperService.areEqual(object1, object2);

      expect(result).toBe(true);
    });

    it('should return false for two different objects', () => {
      const object1 = { name: 'Phil', age: 67 };
      const object2 = { name: 'Mike', age: 67 };
      const result = equalityHelperService.areEqual(object1, object2);

      expect(result).toBe(false);
    });

    it('should return true for a string and an array with the same value', () => {
      const array1 = ['somestring1'];
      const string2 = 'somestring1';
      const result = equalityHelperService.areEqual(array1, string2);

      expect(result).toBe(true);
    });

    it('should return true for an array and a string with the same value', () => {
      const array1 = ['somestring1'];
      const string2 = 'somestring1';
      const result = equalityHelperService.areEqual(string2, array1);

      expect(result).toBe(true);
    });

    it('should return false for a string and an array with different values', () => {
      const array1 = ['somestring'];
      const string2 = 'somestring1';
      const result = equalityHelperService.areEqual(string2, array1);

      expect(result).toBe(false);
    });

    it('should return false for an array and a string with different values', () => {
      const array1 = ['somestring1'];
      const string2 = 'somestring';
      const result = equalityHelperService.areEqual(array1, string2);

      expect(result).toBe(false);
    });

    it('should return false for two different booleans', () => {
      const result = equalityHelperService.areEqual(true, false);

      expect(result).toBe(false);
    });

    it('should return true for two same booleans', () => {
      const result = equalityHelperService.areEqual(true, true);

      expect(result).toBe(true);
    });
  });

  describe('isStringEqualOrNonOrderedArrayEqual', () => {
    const testCases = [
      // first value null/undefined is invalid
      {
        input1: null as any,
        input2: 'value1',
        expected: false,
      },
      // second value null/undefined is invalid
      {
        input1: 'value1',
        input2: null as any,
        expected: false,
      },
      {
        input1: 'value1',
        input2: 'value1',
        expected: true,
      },
      {
        input1: 'value1',
        input2: 'value2',
        expected: false,
      },
      // same length arrays sharing only some values are not equal
      {
        input1: ['value1', 'value2'],
        input2: ['value1', 'value3'],
        expected: false,
      },
      // old "x" (string) , [x] new invalid
      {
        input1: 'value1',
        input2: ['value2'] as any[],
        expected: false,
      },
      // old [x], new "x" (string) invalid
      {
        input1: ['value2'] as any[],
        input2: 'value1',
        expected: false,
      },
      {
        input1: ['value1'] as any[],
        input2: ['value2'] as any[],
        expected: false,
      },
      // old [x,y,z], new [x,y] invalid
      // old [x], new [y,x] invalid
      {
        input1: ['value1'] as any[],
        input2: ['value1', 'value2'] as any[],
        expected: false,
      },
      {
        input1: ['value1', 'value2'] as any[],
        input2: ['value1', 'value2'] as any[],
        expected: true,
      },
      // old [x,y], new [y,x] valid
      {
        input1: ['value1', 'value2'] as any[],
        input2: ['value2', 'value1'] as any[],
        expected: true,
      },
      // old [x,y,z], new [y,z,x] valid
      {
        input1: ['x', 'y', 'z'] as any[],
        input2: ['y', 'z', 'x'] as any[],
        expected: true,
      },
      // old [x,y], new [x,z] invalid (only partial overlap)
      {
        input1: ['x', 'y'] as any[],
        input2: ['x', 'z'] as any[],
        expected: false,
      },
      // old [x,y], new [x,x] invalid (duplicates)
      {
        input1: ['x', 'y'] as any[],
        input2: ['x', 'x'] as any[],
        expected: false,
      },
    ];

    testCases.forEach(({ input1, input2, expected }) => {
      it(`should return '${expected}' if '${input1}' and '${input2}' is given`, () => {
        const result =
          equalityHelperService.isStringEqualOrNonOrderedArrayEqual(
            input1,
            input2
          );

        expect(result).toBe(expected);
      });
    });
  });
});
