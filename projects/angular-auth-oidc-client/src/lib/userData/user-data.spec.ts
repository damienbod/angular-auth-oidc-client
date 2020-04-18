import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';

describe('User Service', () => {
    let configProvider: ConfigurationProvider;
    let loggerService: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConfigurationProvider, LoggerService],
        });
    });

    beforeEach(() => {
        configProvider = TestBed.inject(ConfigurationProvider);
        loggerService = TestBed.inject(LoggerService);
    });

    it('should create', () => {
        expect(loggerService).toBeTruthy();
    });
});
