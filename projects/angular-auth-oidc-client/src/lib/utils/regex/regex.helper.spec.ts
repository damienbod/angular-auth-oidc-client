import { wildcardToRegExp } from './regex.helper';

describe('RegexHelper', () => {
  describe('wildcardToRegExp', () => {
    it('should match wildcards', () => {
      expect(
        wildcardToRegExp('https://third-route.com/*/test').test(
          'https://third-route.com/test2'
        )
      ).toBeFalsy();

      expect(
        wildcardToRegExp('https://third-route.com/*/test').test(
          'https://third-route.com/test'
        )
      ).toBeFalsy();

      expect(
        wildcardToRegExp('https://third-route.com/*/test').test(
          'https://third-route.com/foo/test'
        )
      ).toBeTruthy();

      expect(
        wildcardToRegExp('https://third-route.com/*/test').test(
          'https://third-route.com/foo/test/bar'
        )
      ).toBeFalsy();

      expect(
        wildcardToRegExp('https://third-route.com/*/test/*').test(
          'https://third-route.com/foo/test/bar'
        )
      ).toBeTruthy();
    });
  });
});
