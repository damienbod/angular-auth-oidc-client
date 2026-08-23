import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AbstractLoggerService } from './abstract-logger.service';
import { ConsoleLoggerService } from './console-logger.service';
import { LogLevel } from './log-level';
import { LoggerService } from './logger.service';

describe('Logger Service', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        { provide: AbstractLoggerService, useClass: ConsoleLoggerService },
      ],
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
      const spy = vi.spyOn(console, 'error').mockReturnValue(undefined);

      loggerService.logError(
        { configId: 'configId1', logLevel: LogLevel.None },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log error as default if error is string', () => {
      const spy = vi.spyOn(console, 'error').mockReturnValue(undefined);

      loggerService.logError({ configId: 'configId1' }, 'some message');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('[ERROR] configId1 - some message');
    });

    it('should log error as default if error is object', () => {
      const spy = vi.spyOn(console, 'error').mockReturnValue(undefined);

      loggerService.logError({ configId: 'configId1' }, { some: 'message' });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        '[ERROR] configId1 - {"some":"message"}'
      );
    });

    it('should always log error with args', () => {
      const spy = vi.spyOn(console, 'error').mockReturnValue(undefined);

      loggerService.logError(
        { configId: 'configId1' },
        'some message',
        'arg1',
        'arg2'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        '[ERROR] configId1 - some message',
        'arg1',
        'arg2'
      );
    });
  });

  describe('logWarn', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning(
        { configId: 'configId1', logLevel: undefined },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no config is given', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning({}, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning({ configId: 'configId1' }, 'some message');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning(
        { configId: 'configId1', logLevel: LogLevel.None },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log warning when loglevel is Warn and message is string', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning(
        { configId: 'configId1', logLevel: LogLevel.Warn },
        'some message'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('[WARN] configId1 - some message');
    });

    it('should log warning when loglevel is Warn and message is object', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning(
        { configId: 'configId1', logLevel: LogLevel.Warn },
        { some: 'message' }
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('[WARN] configId1 - {"some":"message"}');
    });

    it('should log warning when loglevel is Warn with args', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning(
        { configId: 'configId1', logLevel: LogLevel.Warn },
        'some message',
        'arg1',
        'arg2'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        '[WARN] configId1 - some message',
        'arg1',
        'arg2'
      );
    });

    it('should log warning when loglevel is Debug', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning(
        { configId: 'configId1', logLevel: LogLevel.Debug },
        'some message'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('[WARN] configId1 - some message');
    });

    it('should not log warning when loglevel is error', () => {
      const spy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      loggerService.logWarning(
        { configId: 'configId1', logLevel: LogLevel.Error },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('logDebug', () => {
    it('should not log if no log level is set (null)', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(
        { configId: 'configId1', logLevel: undefined },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if no log level is set (undefined)', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug({ configId: 'configId1' }, 'some message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if log level is turned off', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(
        { configId: 'configId1', logLevel: LogLevel.None },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should log when loglevel is Debug and value is string', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(
        { configId: 'configId1', logLevel: LogLevel.Debug },
        'some message'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('[DEBUG] configId1 - some message');
    });

    it('should log when loglevel is Debug and value is object', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(
        { configId: 'configId1', logLevel: LogLevel.Debug },
        { some: 'message' }
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        '[DEBUG] configId1 - {"some":"message"}'
      );
    });

    it('should log when loglevel is Debug with args', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(
        { configId: 'configId1', logLevel: LogLevel.Debug },
        'some message',
        'arg1',
        'arg2'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        '[DEBUG] configId1 - some message',
        'arg1',
        'arg2'
      );
    });

    it('should not log when loglevel is Warn', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(
        { configId: 'configId1', logLevel: LogLevel.Warn },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log when loglevel is error', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(
        { configId: 'configId1', logLevel: LogLevel.Error },
        'some message'
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not log if configuration is null', () => {
      const spy = vi.spyOn(console, 'debug').mockReturnValue(undefined);

      loggerService.logDebug(null, 'some message');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('currentLogLevelIsEqualOrSmallerThan', () => {
    it('returns false when no log level is configured', () => {
      const result = (loggerService as any).currentLogLevelIsEqualOrSmallerThan(
        null,
        LogLevel.Debug
      );

      expect(result).toBe(false);
    });
  });

  describe('logLevelIsSet', () => {
    it('returns false when log level is explicitly null', () => {
      const result = (loggerService as any).logLevelIsSet({
        configId: 'configId1',
        logLevel: null,
      });

      expect(result).toBe(false);
    });

    it('returns false when log level is undefined', () => {
      const result = (loggerService as any).logLevelIsSet({
        configId: 'configId1',
      });

      expect(result).toBe(false);
    });

    it('returns false when configuration is null', () => {
      const result = (loggerService as any).logLevelIsSet(null);

      expect(result).toBe(false);
    });
  });

  describe('loggingIsTurnedOff', () => {
    it('does not throw and returns false when configuration is null', () => {
      const result = (loggerService as any).loggingIsTurnedOff(null);

      expect(result).toBe(false);
    });
  });
});
