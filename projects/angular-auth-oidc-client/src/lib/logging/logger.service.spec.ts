import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { AbstractLoggerService } from './abstract-logger.service';
import { ConsoleLoggerService } from './console-logger.service';
import { LogLevel } from './log-level';

describe('Logger Service', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService, { provide: AbstractLoggerService, useClass: ConsoleLoggerService }],
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

      loggerService.logError({ configId: 'configId1', logLevel: LogLevel.None }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log error as default if error is string', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError({ configId: 'configId1' }, 'some message');
      expect(spy).toHaveBeenCalledOnceWith('[ERROR] configId1 - some message');
    });

    it('should log error as default if error is object', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError({ configId: 'configId1' }, { some: 'message' });
      expect(spy).toHaveBeenCalledOnceWith('[ERROR] configId1 - {"some":"message"}');
    });

    it('should always log error with args', () => {
      const spy = spyOn(console, 'error');

      loggerService.logError({ configId: 'configId1' }, 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledOnceWith('[ERROR] configId1 - some message', 'arg1', 'arg2');
    });
  });

  describe('logWarn', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1', logLevel: null }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no config is given', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning(null, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1' }, 'some message');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1', logLevel: LogLevel.None }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log warning when loglevel is Warn and message is string', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1', logLevel: LogLevel.Warn }, 'some message');
      expect(spy).toHaveBeenCalledOnceWith('[WARN] configId1 - some message');
    });

    it('should log warning when loglevel is Warn and message is object', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1', logLevel: LogLevel.Warn }, { some: 'message' });
      expect(spy).toHaveBeenCalledOnceWith('[WARN] configId1 - {"some":"message"}');
    });

    it('should log warning when loglevel is Warn with args', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1', logLevel: LogLevel.Warn }, 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledOnceWith('[WARN] configId1 - some message', 'arg1', 'arg2');
    });

    it('should log warning when loglevel is Debug', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1', logLevel: LogLevel.Debug }, 'some message');
      expect(spy).toHaveBeenCalledOnceWith('[WARN] configId1 - some message');
    });

    it('should not log warning when loglevel is error', () => {
      const spy = spyOn(console, 'warn');

      loggerService.logWarning({ configId: 'configId1', logLevel: LogLevel.Error }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('logDebug', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1', logLevel: null }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1' }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1', logLevel: LogLevel.None }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log when loglevel is Debug and value is string', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1', logLevel: LogLevel.Debug }, 'some message');
      expect(spy).toHaveBeenCalledOnceWith('[DEBUG] configId1 - some message');
    });

    it('should log when loglevel is Debug and value is object', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1', logLevel: LogLevel.Debug }, { some: 'message' });
      expect(spy).toHaveBeenCalledOnceWith('[DEBUG] configId1 - {"some":"message"}');
    });

    it('should log when loglevel is Debug with args', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1', logLevel: LogLevel.Debug }, 'some message', 'arg1', 'arg2');
      expect(spy).toHaveBeenCalledOnceWith('[DEBUG] configId1 - some message', 'arg1', 'arg2');
    });

    it('should not log when loglevel is Warn', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1', logLevel: LogLevel.Warn }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log when loglevel is error', () => {
      const spy = spyOn(console, 'debug');

      loggerService.logDebug({ configId: 'configId1', logLevel: LogLevel.Error }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
