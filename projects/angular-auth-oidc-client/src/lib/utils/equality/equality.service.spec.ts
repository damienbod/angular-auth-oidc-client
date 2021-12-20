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
      const result = equalityHelperService.areEqual('somestring', 'somestring');
      expect(result).toBe(true);
    });

    it('two equal strings but different casing returns false', () => {
      const result = equalityHelperService.areEqual('somestring', 'Somestring');
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

    it('boolean and boolean return false', () => {
      const result = equalityHelperService.areEqual(true, false);
      expect(result).toBe(false);
    });

    it('boolean and boolean return false', () => {
      const result = equalityHelperService.areEqual(true, true);
      expect(result).toBe(true);
    });
  });

  describe('isStringEqualOrNonOrderedArrayEqual', () => {
    const testCases = [
      {
        input1: 'value1',
        input2: 'value1',
        expected: true,
      },
      {
        input1: null,
        input2: 'value2',
        expected: false,
      },
      {
        input1: 'value1',
        input2: null,
        expected: false,
      },
      {
        input1: null,
        input2: null,
        expected: false,
      },
      {
        input1: 'value1',
        input2: 'value2',
        expected: false,
      },
      // old "x" (string) , [x] new invalid
      {
        input1: 'value1',
        input2: ['value2'],
        expected: false,
      },
      // old [x], new "x" (string) invalid
      {
        input1: ['value2'],
        input2: 'value1',
        expected: false,
      },
      {
        input1: ['value1'],
        input2: ['value2'],
        expected: false,
      },
      // old [x,y,z], new [x,y] invalid
      // old [x], new [y,x] invalid
      {
        input1: ['value1'],
        input2: ['value1', 'value2'],
        expected: false,
      },
      {
        input1: ['value1', 'value2'],
        input2: ['value1', 'value2'],
        expected: true,
      },
      // old [x,y], new [y,x] valid
      {
        input1: ['value1', 'value2'],
        input2: ['value2', 'value1'],
        expected: true,
      },
      // old [x,y,z], new [y,z,x] valid
      {
        input1: ['x', 'y', 'z'],
        input2: ['y', 'z', 'x'],
        expected: true,
      },
    ];

    testCases.forEach(({ input1, input2, expected }) => {
      it(`returns '${expected}' if '${input1}' and '${input2}' is given`, () => {
        const result = equalityHelperService.isStringEqualOrNonOrderedArrayEqual(input1, input2);
        expect(result).toBe(expected);
      });
    });
  });
});
