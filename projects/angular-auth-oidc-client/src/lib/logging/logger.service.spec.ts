import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { LogLevel } from './log-level';

describe('Logger Service', () => {
    let configProvider: ConfigurationProvider;
    let loggerService: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConfigurationProvider, LoggerService, { provide: PlatformProvider, useClass: PlatformProviderMock }],
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
        it('should always log error', () => {
            const spy = spyOn(console, 'error');

            loggerService.logError('some message');
            expect(spy).toHaveBeenCalledWith('some message');
        });

        it('should always log error with args', () => {
            const spy = spyOn(console, 'error');

            loggerService.logError('some message', 'arg1', 'arg2');
            expect(spy).toHaveBeenCalledWith('some message', ['arg1', 'arg2']);
        });
    });

    describe('logWarn', () => {
        it('should log warning when loglevel is Warn', () => {
            const spy = spyOn(console, 'warn');

            configProvider.setConfig({ logLevel: LogLevel.Warn });
            loggerService.logWarning('some message');
            expect(spy).toHaveBeenCalledWith('some message');
        });

        it('should log warning when loglevel is Warn with args', () => {
            const spy = spyOn(console, 'warn');

            configProvider.setConfig({ logLevel: LogLevel.Warn });
            loggerService.logWarning('some message', 'arg1', 'arg2');
            expect(spy).toHaveBeenCalledWith('some message', ['arg1', 'arg2']);
        });

        it('should log warning when loglevel is Debug', () => {
            const spy = spyOn(console, 'warn');

            configProvider.setConfig({ logLevel: LogLevel.Debug });
            loggerService.logWarning('some message');
            expect(spy).toHaveBeenCalledWith('some message');
        });

        it('should not log warning when loglevel is error', () => {
            const spy = spyOn(console, 'warn');

            configProvider.setConfig({ logLevel: LogLevel.Error });
            loggerService.logWarning('some message');
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('logDebug', () => {
        it('should log when loglevel is Debug', () => {
            const spy = spyOn(console, 'log');

            configProvider.setConfig({ logLevel: LogLevel.Debug });
            loggerService.logDebug('some message');
            expect(spy).toHaveBeenCalledWith('some message');
        });

        it('should log when loglevel is Debug with args', () => {
            const spy = spyOn(console, 'log');

            configProvider.setConfig({ logLevel: LogLevel.Debug });
            loggerService.logDebug('some message', 'arg1', 'arg2');
            expect(spy).toHaveBeenCalledWith('some message', ['arg1', 'arg2']);
        });

        it('should not log when loglevel is Warn', () => {
            const spy = spyOn(console, 'log');

            configProvider.setConfig({ logLevel: LogLevel.Warn });
            loggerService.logDebug('some message');
            expect(spy).not.toHaveBeenCalled();
        });

        it('should not log when loglevel is error', () => {
            const spy = spyOn(console, 'log');

            configProvider.setConfig({ logLevel: LogLevel.Error });
            loggerService.logDebug('some message');
            expect(spy).not.toHaveBeenCalled();
        });
    });
});
