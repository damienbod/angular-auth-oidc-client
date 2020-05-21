import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
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
            const spy = spyOn(storagePersistanceService, 'write');

            const result = service.createNonce();

            expect(result).toBeTruthy();
            expect(spy).toHaveBeenCalledWith('authNonce', result);
        });
    });

    describe('AuthStateControl', () => {
        it('getAuthStateControl returns property from store', () => {
            const spy = spyOn(storagePersistanceService, 'read');

            service.getAuthStateControl();

            expect(spy).toHaveBeenCalledWith('authStateControl');
        });

        it('setAuthStateControl saves property in store', () => {
            const spy = spyOn(storagePersistanceService, 'write');

            service.setAuthStateControl('ToSave');

            expect(spy).toHaveBeenCalledWith('authStateControl', 'ToSave');
        });
    });

    describe('getExistingOrCreateAuthStateControl', () => {
        it('if nothing stored it creates a 40 char one and saves the authStateControl', () => {
            spyOn(storagePersistanceService, 'read').withArgs('authStateControl').and.returnValue(null);
            const setSpy = spyOn(storagePersistanceService, 'write');

            const result = service.getExistingOrCreateAuthStateControl();

            expect(result).toBeTruthy();
            expect(result.length).toBe(41);
            expect(setSpy).toHaveBeenCalledWith('authStateControl', result);
        });

        it('if stored it returns the value and does NOT Store the value again', () => {
            spyOn(storagePersistanceService, 'read').withArgs('authStateControl').and.returnValue('someAuthStateControl');
            const setSpy = spyOn(storagePersistanceService, 'write');

            const result = service.getExistingOrCreateAuthStateControl();

            expect(result).toEqual('someAuthStateControl');
            expect(result.length).toBe('someAuthStateControl'.length);
            expect(setSpy).not.toHaveBeenCalled();
        });
    });

    describe('setSessionState', () => {
        it('setSessionState saves the value in the storage', () => {
            const spy = spyOn(storagePersistanceService, 'write');

            service.setSessionState('Genesis');

            expect(spy).toHaveBeenCalledWith('session_state', 'Genesis');
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
            const spy = spyOn(storagePersistanceService, 'read').withArgs('codeVerifier').and.returnValue('Genesis');

            const result = service.getCodeVerifier();

            expect(result).toBe('Genesis');
            expect(spy).toHaveBeenCalledWith('codeVerifier');
        });

        it('createCodeVerifier returns random createCodeVerifier and stores it', () => {
            const setSpy = spyOn(storagePersistanceService, 'write');

            const result = service.createCodeVerifier();

            expect(result).toBeTruthy();
            expect(result.length).toBe(67);
            expect(setSpy).toHaveBeenCalledWith('codeVerifier', result);
        });
    });

    describe('setSilentRenewRunning', () => {
        it('set setSilentRenewRunning to `running` when called', () => {
            const spy = spyOn(storagePersistanceService, 'write');
            service.setSilentRenewRunning();
            expect(spy).toHaveBeenCalledWith('storageSilentRenewRunning', 'running');
        });
    });

    describe('resetSilentRenewRunning', () => {
        it('set resetSilentRenewRunning to `` when called', () => {
            const spy = spyOn(storagePersistanceService, 'write');
            service.resetSilentRenewRunning();
            expect(spy).toHaveBeenCalledWith('storageSilentRenewRunning', ``);
        });
    });
});
