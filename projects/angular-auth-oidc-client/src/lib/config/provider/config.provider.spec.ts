import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from './config.provider';

describe('ConfigurationProviderTests', () => {
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigurationProvider],
    });
  });

  beforeEach(() => {
    configurationProvider = TestBed.inject(ConfigurationProvider);
  });

  it('should create', () => {
    expect(configurationProvider).toBeTruthy();
  });

  describe('getOpenIDConfiguration', () => {
    it('returns only config when only one is stored and no param is passed', () => {
      configurationProvider.setConfig({ authority: 'hello' });

      expect(configurationProvider.getOpenIDConfiguration()).toBeDefined();
    });

    it('returns first config when multiple are stored and no param is passed', () => {
      configurationProvider.setConfig({ configId: 'configId1' });
      configurationProvider.setConfig({ configId: 'configId2' });

      const result = configurationProvider.getOpenIDConfiguration();

      expect(result.configId).toBe('configId1');
      expect(result.configId).not.toBe('configId2');
    });

    it('returns config when multiple are stored and param is passed', () => {
      configurationProvider.setConfig({ configId: 'configId1' });
      configurationProvider.setConfig({ configId: 'configId2' });

      const result = configurationProvider.getOpenIDConfiguration('configId1');

      expect(result.configId).toBe('configId1');
      expect(result.configId).not.toBe('configId2');
    });

    it('returns null when multiple are stored and param is passed but param does not fit', () => {
      configurationProvider.setConfig({ configId: 'configId1' });
      configurationProvider.setConfig({ configId: 'configId2' });

      const result = configurationProvider.getOpenIDConfiguration('something-stupid');

      expect(result).toBeNull();
    });

    it('get openIDConfiguration returns null when openIdConfigurationInternal is falsy', () => {
      // do not set anything
      expect(configurationProvider.getOpenIDConfiguration()).toBeNull();
    });
  });

  describe('hasAsLeastOneConfig', () => {
    it('hasConfig is true if config is set', () => {
      configurationProvider.setConfig({ authority: 'hello' });

      expect(configurationProvider.hasAsLeastOneConfig()).toBeTrue();
    });

    it('hasConfig is false if no config is set', () => {
      expect(configurationProvider.hasAsLeastOneConfig()).toBeFalse();
    });
  });

  describe('hasManyConfigs', () => {
    it('returns true if multiple configs are stored', () => {
      configurationProvider.setConfig({ configId: 'configId1' });
      configurationProvider.setConfig({ configId: 'configId2' });

      expect(configurationProvider.hasManyConfigs()).toBeTrue();
    });

    it('returns false if only one config is stored', () => {
      configurationProvider.setConfig({ configId: 'configId1' });

      expect(configurationProvider.hasManyConfigs()).toBeFalse();
    });
  });

  describe('getAllConfigurations', () => {
    it('returns all stored configurations', () => {
      configurationProvider.setConfig({ configId: 'configId1' });
      configurationProvider.setConfig({ configId: 'configId2' });

      const result = configurationProvider.getAllConfigurations();

      expect(Array.isArray(result)).toBeTrue();
      expect(result.length).toBe(2);
    });

    it('hasConfig is false if no config is set', () => {
      expect(configurationProvider.hasAsLeastOneConfig()).toBeFalse();
    });
  });
});
