import { TestBed } from '@angular/core/testing';
import { LogLevel } from '../../logging/log-level';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { ConfigValidationService } from './config-validation.service';

describe('Config Validation Service', () => {
  let configValidationService: ConfigValidationService;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigValidationService, { provide: LoggerService, useClass: LoggerServiceMock }],
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
    const messageTypeSpy = spyOn(configValidationService as any, 'getAllMessagesOfType');
    messageTypeSpy.withArgs('warning', jasmine.any(Array)).and.returnValue(['A warning message']);
    messageTypeSpy.withArgs('error', jasmine.any(Array)).and.callThrough();
    const anyConfig = VALID_CONFIG;
    configValidationService.validateConfig(anyConfig);
    expect(loggerWarningSpy).toHaveBeenCalled();
  });

  describe('ensure-clientId.rule', () => {
    it('return false when no clientId is set', () => {
      const config = { ...VALID_CONFIG, clientId: null };
      const result = configValidationService.validateConfig(config);
      expect(result).toBeFalse();
    });
  });

  describe('ensure-authority-server.rule', () => {
    it('return false when no security token service is set', () => {
      const config = { ...VALID_CONFIG, authority: null };
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
      const config = { ...VALID_CONFIG, silentRenew: true, useRefreshToken: false, silentRenewUrl: null };
      const result = configValidationService.validateConfig(config);
      expect(result).toBeFalse();
    });
  });

  describe('use-offline-scope-with-silent-renew.rule', () => {
    it('return true but warning when silent renew is used with useRefreshToken but no offline_access scope is given', () => {
      const config = { ...VALID_CONFIG, silentRenew: true, useRefreshToken: true, scopes: 'scope1 scope2 but_no_offline_access' };

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
      const config1 = { ...VALID_CONFIG, silentRenew: true, useRefreshToken: true, scopes: 'scope1 scope2 but_no_offline_access' };
      const config2 = { ...VALID_CONFIG, silentRenew: true, useRefreshToken: true, scopes: 'scope1 scope2 but_no_offline_access' };

      const loggerErrorSpy = spyOn(loggerService, 'logError');
      const loggerWarningSpy = spyOn(loggerService, 'logWarning');

      const result = configValidationService.validateConfigs([config1, config2]);

      expect(result).toBeTrue();
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(loggerWarningSpy.calls.argsFor(0)).toEqual([
        undefined,
        'You added multiple configs with the same authority, clientId and scope',
      ]);
      expect(loggerWarningSpy.calls.argsFor(1)).toEqual([
        undefined,
        'You added multiple configs with the same authority, clientId and scope',
      ]);
    });

    it('should return false and a better error message when config is not passed as object with config property', () => {
      const loggerErrorSpy = spyOn(loggerService, 'logError');
      const loggerWarningSpy = spyOn(loggerService, 'logWarning');

      const result = configValidationService.validateConfigs([null]);

      expect(result).toBeFalse();
      expect(loggerWarningSpy).not.toHaveBeenCalled();
      expect(loggerErrorSpy.calls.argsFor(0)).toEqual([
        undefined,
        `Please make sure you add an object with a 'config' property: ....({ config }) instead of ...(config)`,
      ]);
    });
  });
});
