import { TestBed } from '@angular/core/testing';
import { TestLogging } from '../../tests/common/test-logging.service';
import { HttpBaseService } from '../api/http-base.service';
import { LoggerService } from '../services/oidc.logger.service';
import { ConfigurationProvider } from './config.provider';
import { OidcConfigService } from './config.service';

describe('Configuration Service', () => {
    let oidcConfigService: OidcConfigService;
    let loggerService: LoggerService;

    const httpbaseMock = jasmine.createSpyObj('HttpBaseService', ['get', 'post', 'put', 'delete', 'patch']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                OidcConfigService,
                {
                    provide: LoggerService,
                    useClass: TestLogging,
                },
                ConfigurationProvider,
                {
                    provide: HttpBaseService,
                    useValue: httpbaseMock,
                },
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
