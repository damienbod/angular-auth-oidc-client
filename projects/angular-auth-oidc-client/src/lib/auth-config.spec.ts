import { PassedInitialConfig, createStaticLoader } from './auth-config';

describe('AuthConfig', () => {
  describe('createStaticLoader', () => {
    it('should throw an error if no config is provided', () => {
      // Arrange
      const passedConfig = {} as PassedInitialConfig;
      // Act
      // Assert
      expect(() => createStaticLoader(passedConfig)).toThrowError(
        'No config provided!'
      );
    });
  });
});
