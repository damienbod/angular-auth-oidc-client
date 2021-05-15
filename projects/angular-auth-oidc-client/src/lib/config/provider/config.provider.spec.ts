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

  it('setup defines openIDConfiguration', () => {
    configurationProvider.setConfig({ stsServer: 'hello' });

    expect(configurationProvider.getOpenIDConfiguration()).toBeDefined();
  });

  it('hasConfig is true if config is set', () => {
    configurationProvider.setConfig({ stsServer: 'hello' });

    expect(configurationProvider.hasConfig()).toBeTrue();
  });

  it('get openIDConfiguration returns null when openIdConfigurationInternal is falsy', () => {
    // do not set anything
    expect(configurationProvider.getOpenIDConfiguration()).toBeNull();
  });
});
