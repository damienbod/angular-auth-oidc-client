import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { FlowsDataService } from './flows-data.service';
import { RandomService } from './random/random.service';

describe('Flows Data Service', () => {
    let service: FlowsDataService;
    let storagePersistanceService: StoragePersistanceService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FlowsDataService,
                RandomService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(FlowsDataService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('nonce', () => {
        it('createNonce returns nonce and stores it', () => {
            const spy = spyOnProperty(storagePersistanceService, 'authNonce', 'set');

            const result = service.createNonce();

            expect(result).toBeTruthy();
            expect(spy).toHaveBeenCalledWith(result);
        });
    });

    describe('AuthStateControl', () => {
        it('getAuthStateControl returns property from store', () => {
            const spy = spyOnProperty(storagePersistanceService, 'authStateControl', 'get');

            service.getAuthStateControl();

            expect(spy).toHaveBeenCalled();
        });

        it('setAuthStateControl saves property in store', () => {
            const spy = spyOnProperty(storagePersistanceService, 'authStateControl', 'set');

            service.setAuthStateControl('ToSave');

            expect(spy).toHaveBeenCalledWith('ToSave');
        });
    });

    describe('getExistingOrCreateAuthStateControl', () => {
        it('if nothing stored it creates a 40 char one and saves the authStateControl', () => {
            spyOnProperty(storagePersistanceService, 'authStateControl', 'get').and.returnValue(null);
            const setSpy = spyOnProperty(storagePersistanceService, 'authStateControl', 'set');

            const result = service.getExistingOrCreateAuthStateControl();

            expect(result).toBeTruthy();
            expect(result.length).toBe(41);
            expect(setSpy).toHaveBeenCalledWith(result);
        });

        it('if stored it returns the value and does NOT Store the value again', () => {
            spyOnProperty(storagePersistanceService, 'authStateControl', 'get').and.returnValue('someAuthStateControl');
            const setSpy = spyOnProperty(storagePersistanceService, 'authStateControl', 'set');

            const result = service.getExistingOrCreateAuthStateControl();

            expect(result).toEqual('someAuthStateControl');
            expect(result.length).toBe('someAuthStateControl'.length);
            expect(setSpy).not.toHaveBeenCalled();
        });
    });

    describe('setSessionState', () => {
        it('setSessionState saves the value in the storage', () => {
            const spy = spyOnProperty(storagePersistanceService, 'sessionState', 'set');

            service.setSessionState('Genesis');

            expect(spy).toHaveBeenCalledWith('Genesis');
        });
    });

    describe('resetStorageFlowData', () => {
        it('resetStorageFlowData calls correct method on storagePersistanceService', () => {
            const spy = spyOn(storagePersistanceService, 'resetStorageFlowData');

            service.resetStorageFlowData();

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('codeVerifier', () => {
        it('getCodeVerifier returns value from the store', () => {
            const spy = spyOnProperty(storagePersistanceService, 'codeVerifier', 'get').and.returnValue('Genesis');

            const result = service.getCodeVerifier();

            expect(result).toBe('Genesis');
            expect(spy).toHaveBeenCalled();
        });

        it('createCodeVerifier returns random createCodeVerifier and stores it', () => {
            const setSpy = spyOnProperty(storagePersistanceService, 'codeVerifier', 'set');

            const result = service.createCodeVerifier();

            expect(result).toBeTruthy();
            expect(result.length).toBe(67);
            expect(setSpy).toHaveBeenCalledWith(result);
        });
    });
});
