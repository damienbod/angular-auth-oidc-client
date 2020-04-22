import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { AbstractSecurityStorage, StoragePersistanceService } from '../storage';
import { BrowserStorageMock } from './browser-storage.service-mock';

describe('Flows Data Service', () => {
    let service: StoragePersistanceService;
    let configurationProvider: ConfigurationProvider;
    let securityStorage: AbstractSecurityStorage;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                StoragePersistanceService,
                { provide: AbstractSecurityStorage, useClass: BrowserStorageMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
            ],
        });
    });

    beforeEach(() => {
        configurationProvider = TestBed.inject(ConfigurationProvider);
        service = TestBed.inject(StoragePersistanceService);
        securityStorage = TestBed.inject(AbstractSecurityStorage);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('authResult', () => {
        it('createNonce returns nonce and stores it', () => {
            spyOn(securityStorage, 'read').and.returnValue('authResultFromStore');
            const spy = spyOnProperty(service, 'authResult', 'get');
            // const result = service.createNonce();
            // expect(result).toBeTruthy();
            // expect(spy).toHaveBeenCalledWith(result);
        });
    });
});
