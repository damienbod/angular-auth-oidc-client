import { async, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { SigninKeyDataService } from './signin-key-data.service';

describe('Signin Key Data Service', () => {
    let service: SigninKeyDataService;
    let configProvider: ConfigurationProvider;
    let dataService: DataService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SigninKeyDataService,
                { provide: DataService, useClass: DataServiceMock },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(SigninKeyDataService);
        configProvider = TestBed.inject(ConfigurationProvider);
        dataService = TestBed.inject(DataService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('getSigningKeys', () => {
        it('throws error when no wellknownendpoints given', async(() => {
            spyOnProperty(configProvider, 'wellKnownEndpoints').and.returnValue(null);
            const result = service.getSigningKeys();

            result.subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('throws error when no jwksUri given', async(() => {
            spyOnProperty(configProvider, 'wellKnownEndpoints').and.returnValue({ jwksUri: null });
            const result = service.getSigningKeys();

            result.subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('calls dataservice if jwksurl is given', async(() => {
            spyOnProperty(configProvider, 'wellKnownEndpoints').and.returnValue({ jwksUri: 'someUrl' });
            const spy = spyOn(dataService, 'get').and.callFake(() => {
                return of();
            });

            const result = service.getSigningKeys();

            result.subscribe({
                complete: () => {
                    expect(spy).toHaveBeenCalledWith('someUrl');
                },
            });
        }));
    });
});
