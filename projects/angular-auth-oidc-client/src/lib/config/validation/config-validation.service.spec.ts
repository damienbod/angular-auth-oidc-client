import { TestBed } from '@angular/core/testing';
import { mockProvider } from '../../../test/auto-mock';
import { LogLevel } from '../../logging/log-level';
import { LoggerService } from '../../logging/logger.service';
import { OpenIdConfiguration } from '../openid-configuration';
import { ConfigValidationService } from './config-validation.service';
import { allMultipleConfigRules } from './rules';

describe('Config Validation Service', () => {
  let configValidationService: ConfigValidationService;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigValidationService, mockProvider(LoggerService)],
    });
  });

  const VALID_CONFIG = {
    authority: 'https://offeringsolutions-sts.azurewebsites.net',
    redirectUrl: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    clientId: 'angularClient',
    scope: 'openid profile email',
    responseType: 'code',
    silentRenew: true,
    silentRenewUrl: `${window.location.origin}/silent-renew.html`,
    renewTimeBeforeTokenExpiresInSeconds: 10,
    logLevel: LogLevel.Debug,
  };

  beforeEach(() => {
    configValidationService = TestBed.inject(ConfigValidationService);
    loggerService = TestBed.inject(LoggerService);
  });

  it('should create', () => {
    expect(configValidationService).toBeTruthy();
  });

  it('should return false for empty config', () => {
    const config = {};
    const result = configValidationService.validateConfig(config);

    expect(result).toBeFalse();
  });

  it('should return true for valid config', () => {
    const result = configValidationService.validateConfig(VALID_CONFIG);

    expect(result).toBeTrue();
  });

  it('calls `logWarning` if one rule has warning level', () => {
    const loggerWarningSpy = spyOn(loggerService, 'logWarning');
    const messageTypeSpy = spyOn(
      configValidationService as any,
      'getAllMessagesOfType'
    );

    messageTypeSpy
      .withArgs('warning', jasmine.any(Array))
      .and.returnValue(['A warning message']);
    messageTypeSpy.withArgs('error', jasmine.any(Array)).and.callThrough();

    configValidationService.validateConfig(VALID_CONFIG);
    expect(loggerWarningSpy).toHaveBeenCalled();
  });

  describe('ensure-clientId.rule', () => {
    it('return false when no clientId is set', () => {
      const config = { ...VALID_CONFIG, clientId: '' } as OpenIdConfiguration;
      const result = configValidationService.validateConfig(config);

      expect(result).toBeFalse();
    });
  });

  describe('ensure-authority-server.rule', () => {
    it('return false when no security token service is set', () => {
      const config = {
        ...VALID_CONFIG,
        authority: '',
      } as OpenIdConfiguration;
      const result = configValidationService.validateConfig(config);

      expect(result).toBeFalse();
    });
  });

  describe('ensure-redirect-url.rule', () => {
    it('return false for no redirect Url', () => {
      const config = { ...VALID_CONFIG, redirectUrl: '' };
      const result = configValidationService.validateConfig(config);

      expect(result).toBeFalse();
    });
  });

  describe('ensureSilentRenewUrlWhenNoRefreshTokenUsed', () => {
    it('return false when silent renew is used with no useRefreshToken and no silentrenewUrl', () => {
      const config = {
        ...VALID_CONFIG,
        silentRenew: true,
        useRefreshToken: false,
        silentRenewUrl: '',
      } as OpenIdConfiguration;
      const result = configValidationService.validateConfig(config);

      expect(result).toBeFalse();
    });
  });

  describe('use-offline-scope-with-silent-renew.rule', () => {
    it('return true but warning when silent renew is used with useRefreshToken but no offline_access scope is given', () => {
      const config = {
        ...VALID_CONFIG,
        silentRenew: true,
        useRefreshToken: true,
        scopes: 'scope1 scope2 but_no_offline_access',
      };
      const loggerSpy = spyOn(loggerService, 'logError');
      const loggerWarningSpy = spyOn(loggerService, 'logWarning');
      const result = configValidationService.validateConfig(config);

      expect(result).toBeTrue();
      expect(loggerSpy).not.toHaveBeenCalled();
      expect(loggerWarningSpy).toHaveBeenCalled();
    });
  });

  describe('ensure-no-duplicated-configs.rule', () => {
    it('should print out correct error when mutiple configs with same properties are passed', () => {
      const config1 = {
        ...VALID_CONFIG,
        silentRenew: true,
        useRefreshToken: true,
        scopes: 'scope1 scope2 but_no_offline_access',
      };
      const config2 = {
        ...VALID_CONFIG,
        silentRenew: true,
        useRefreshToken: true,
        scopes: 'scope1 scope2 but_no_offline_access',
      };
      const loggerErrorSpy = spyOn(loggerService, 'logError');
      const loggerWarningSpy = spyOn(loggerService, 'logWarning');
      const result = configValidationService.validateConfigs([
        config1,
        config2,
      ]);

      expect(result).toBeTrue();
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(loggerWarningSpy.calls.argsFor(0)).toEqual([
        config1,
        'You added multiple configs with the same authority, clientId and scope',
      ]);
      expect(loggerWarningSpy.calls.argsFor(1)).toEqual([
        config2,
        'You added multiple configs with the same authority, clientId and scope',
      ]);
    });

    it('should return false and a better error message when config is not passed as object with config property', () => {
      const loggerWarningSpy = spyOn(loggerService, 'logWarning');
      const result = configValidationService.validateConfigs([]);

      expect(result).toBeFalse();
      expect(loggerWarningSpy).not.toHaveBeenCalled();
    });
  });

  describe('validateConfigs', () => {
    it('calls internal method with empty array if something falsy is passed', () => {
      const spy = spyOn(
        configValidationService as any,
        'validateConfigsInternal'
      ).and.callThrough();
      const result = configValidationService.validateConfigs([]);

      expect(result).toBeFalse();
      expect(spy).toHaveBeenCalledOnceWith([], allMultipleConfigRules);
    });
  });
});
