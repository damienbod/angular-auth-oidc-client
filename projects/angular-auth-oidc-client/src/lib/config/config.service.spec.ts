import { TestBed } from '@angular/core/testing';
import { DataServiceMock } from '../api/data-service-mock';
import { DataService } from '../api/data.service';
import { EventsService } from '../events';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { ConfigurationProvider } from './config.provider';
import { ConfigurationProviderMock } from './config.provider-mock';
import { OidcConfigService } from './config.service';

describe('Configuration Service', () => {
    let oidcConfigService: OidcConfigService;
    let loggerService: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                OidcConfigService,
                {
                    provide: LoggerService,
                    useClass: LoggerServiceMock,
                },
                {
                    provide: ConfigurationProvider,
                    useClass: ConfigurationProviderMock,
                },
                {
                    provide: DataService,
                    useValue: DataServiceMock,
                },
                EventsService,
            ],
        });
    });

    beforeEach(() => {
        oidcConfigService = TestBed.inject(OidcConfigService);
        loggerService = TestBed.inject(LoggerService);
    });

    it('should create', () => {
        expect(oidcConfigService).toBeTruthy();
    });

    it('withConfig without sts server does nothing and logs error', () => {
        const config = {};
        spyOn(loggerService, 'logError');

        const promiseReturn = oidcConfigService.withConfig(config);

        expect(promiseReturn).toBeUndefined();
        expect(loggerService.logError).toHaveBeenCalled();
    });
});
