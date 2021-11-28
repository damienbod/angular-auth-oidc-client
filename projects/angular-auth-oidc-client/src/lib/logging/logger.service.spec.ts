import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { LogLevel } from './log-level';

describe('Logger Service', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
  });

  beforeEach(() => {
    loggerService = TestBed.inject(LoggerService);
  });

  it('should create', () => {
    expect(loggerService).toBeTruthy();
  });

  describe('logError', () => {
    it('should not log error if loglevel is None', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError({ configId: 'configId', logLevel: LogLevel.None }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log error as default', () => {
      const spy = spyOn(console, 'error');
      loggerService.logError({ configId: 'configId' }, 'some message');
      expect(spy).toHaveBeenCalledWith('[ERROR] configId - some message');
    });

    it('should always log error with args', () => {
      const spy = spyOn(console, 'error');
      loggerService.logError({ configId: 'configId' }, 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledWith('[ERROR] configId - some message', 'arg1', 'arg2');
    });

    it('should log error also when configId is null', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError(null, 'some message');

      expect(spy).toHaveBeenCalledWith('[ERROR] - some message');
    });

    it('should log error also when configId is null and has args', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError(null, 'some message', 'arg1', 'arg2');

      expect(spy).toHaveBeenCalledWith('[ERROR] - some message', 'arg1', 'arg2');
    });

    it('should log error also when configId is undefined', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError(undefined, 'some message');

      expect(spy).toHaveBeenCalledWith('[ERROR] - some message');
    });

    it('should log error also when configId is undefined and has args', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError(undefined, 'some message', 'arg1', 'arg2');

      expect(spy).toHaveBeenCalledWith('[ERROR] - some message', 'arg1', 'arg2');
    });
  });

  describe('logWarn', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId', logLevel: null }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId' }, 'some message');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId', logLevel: LogLevel.None }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log warning when loglevel is Warn', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId', logLevel: LogLevel.Warn }, 'some message');
      expect(spy).toHaveBeenCalledWith('[WARN] configId - some message');
    });

    it('should log warning when loglevel is Warn with args', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId', logLevel: LogLevel.Warn }, 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledWith('[WARN] configId - some message', 'arg1', 'arg2');
    });

    it('should log warning when loglevel is Debug', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId', logLevel: LogLevel.Debug }, 'some message');
      expect(spy).toHaveBeenCalledWith('[WARN] configId - some message');
    });

    it('should not log warning when loglevel is error', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId', logLevel: LogLevel.Error }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log warning also when configId is null', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: null, logLevel: LogLevel.Error }, 'some message');

      expect(spy).toHaveBeenCalledWith('[WARN] - some message');
    });

    it('should log warning also when configId is null and has args', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: null, logLevel: LogLevel.Error }, 'some message', 'arg1', 'arg2');

      expect(spy).toHaveBeenCalledWith('[WARN] - some message', 'arg1', 'arg2');
    });

    it('should log warning also when configId is undefined', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ logLevel: LogLevel.Error }, 'some message');

      expect(spy).toHaveBeenCalledWith('[WARN] - some message');
    });

    it('should log warning also when configId is undefined and has args', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ logLevel: LogLevel.Error }, 'some message', 'arg1', 'arg2');

      expect(spy).toHaveBeenCalledWith('[WARN] - some message', 'arg1', 'arg2');
    });
  });

  describe('logDebug', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug({ configId: 'configId', logLevel: null }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug({ configId: 'configId' }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug({ configId: 'configId', logLevel: LogLevel.None }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log when loglevel is Debug', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug({ configId: 'configId', logLevel: LogLevel.Debug }, 'some message');
      expect(spy).toHaveBeenCalledWith('[DEBUG] configId - some message');
    });

    it('should log when loglevel is Debug with args', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug({ configId: 'configId', logLevel: LogLevel.Debug }, 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledWith('[DEBUG] configId - some message', 'arg1', 'arg2');
    });

    it('should not log when loglevel is Warn', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug({ configId: 'configId', logLevel: LogLevel.Warn }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log when loglevel is error', () => {
      const spy = spyOn(console, 'log');

      loggerService.logDebug({ configId: 'configId', logLevel: LogLevel.Error }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
