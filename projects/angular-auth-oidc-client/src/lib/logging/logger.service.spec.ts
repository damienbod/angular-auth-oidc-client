import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { LogLevel } from './log-level';

fdescribe('Logger Service', () => {
  let configProvider: ConfigurationProvider;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: PlatformProvider, useClass: PlatformProviderMock },
      ],
    });
  });

  beforeEach(() => {
    configProvider = TestBed.inject(ConfigurationProvider);
    loggerService = TestBed.inject(LoggerService);
  });

  it('should create', () => {
    expect(loggerService).toBeTruthy();
  });

  describe('logError', () => {
    it('should not log error if loglevel is None', () => {
      const spy = spyOn(console, 'error');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.None });

      loggerService.logError('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log error as default', () => {
      const spy = spyOn(console, 'error');
      loggerService.logError('configId', 'some message');
      expect(spy).toHaveBeenCalledWith('[ERROR] configId - some message');
    });

    it('should always log error with args', () => {
      const spy = spyOn(console, 'error');
      loggerService.logError('configId', 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledWith('[ERROR] configId - some message', 'arg1', 'arg2');
    });
  });

  describe('logWarn', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = spyOn(console, 'warn');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: null });

      loggerService.logWarning('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = spyOn(console, 'warn');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({});

      loggerService.logWarning('configId', 'some message');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = spyOn(console, 'warn');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.None });

      loggerService.logWarning('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log warning when loglevel is Warn', () => {
      const spy = spyOn(console, 'warn');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Warn });

      loggerService.logWarning('configId', 'some message');
      expect(spy).toHaveBeenCalledWith('[WARN] configId - some message');
    });

    it('should log warning when loglevel is Warn with args', () => {
      const spy = spyOn(console, 'warn');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Warn });

      loggerService.logWarning('configId', 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledWith('[WARN] configId - some message', 'arg1', 'arg2');
    });

    it('should log warning when loglevel is Debug', () => {
      const spy = spyOn(console, 'warn');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Debug });

      loggerService.logWarning('configId', 'some message');
      expect(spy).toHaveBeenCalledWith('[WARN] configId - some message');
    });

    it('should not log warning when loglevel is error', () => {
      const spy = spyOn(console, 'warn');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Error });

      loggerService.logWarning('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('logDebug', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = spyOn(console, 'log');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: null });

      loggerService.logDebug('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = spyOn(console, 'log');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.None });

      loggerService.logDebug('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log when loglevel is Debug', () => {
      const spy = spyOn(console, 'log');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Debug });

      loggerService.logDebug('configId', 'some message');
      expect(spy).toHaveBeenCalledWith('[DEBUG] configId - some message');
    });

    it('should log when loglevel is Debug with args', () => {
      const spy = spyOn(console, 'log');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Debug });

      loggerService.logDebug('configId', 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledWith('[DEBUG] configId - some message', 'arg1', 'arg2');
    });

    it('should not log when loglevel is Warn', () => {
      const spy = spyOn(console, 'log');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Warn });

      loggerService.logDebug('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log when loglevel is error', () => {
      const spy = spyOn(console, 'log');

      spyOn(configProvider, 'getOpenIDConfiguration').and.returnValue({ logLevel: LogLevel.Error });

      loggerService.logDebug('configId', 'some message');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
