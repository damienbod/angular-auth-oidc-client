import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { ConfigValidationService } from './config-validation.service';

describe('Config Validation Service', () => {
    let configValidationService: ConfigValidationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConfigValidationService, { provide: LoggerService, useClass: LoggerServiceMock }],
        });
    });

    beforeEach(() => {
        configValidationService = TestBed.inject(ConfigValidationService);
    });

    it('should create', () => {
        expect(configValidationService).toBeTruthy();
    });
});
