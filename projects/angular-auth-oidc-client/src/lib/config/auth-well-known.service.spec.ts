import { async, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownService } from './auth-well-known.service';

describe('AuthWellKnownService', () => {
    let service: AuthWellKnownService;
    let dataService: AuthWellKnownDataService;
    let storagePersistanceService: StoragePersistanceService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthWellKnownService,
                { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
                { provide: DataService, useClass: DataServiceMock },
                AuthWellKnownDataService,
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(AuthWellKnownService);
        dataService = TestBed.inject(AuthWellKnownDataService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('getAuthWellKnownEndPoints', () => {
        it('getAuthWellKnownEndPoints return stored endpoints if they exist', async(() => {
            const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsFromUrl');
            spyOnProperty(storagePersistanceService, 'authWellKnownEndPoints', 'get').and.returnValue({ issuer: 'anything' });
            service.getAuthWellKnownEndPoints('any-url').subscribe((result) => {
                expect(dataServiceSpy).not.toHaveBeenCalled();
                expect(result).toEqual({ issuer: 'anything' });
            });
        }));

        it('getAuthWellKnownEndPoints calls dataservice if none is stored', async(() => {
            const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsFromUrl').and.returnValue(of({ issuer: 'anything' }));
            spyOnProperty(storagePersistanceService, 'authWellKnownEndPoints', 'get').and.returnValue(null);
            service.getAuthWellKnownEndPoints('any-url').subscribe((result) => {
                expect(dataServiceSpy).toHaveBeenCalled();
                expect(result).toEqual({ issuer: 'anything' });
            });
        }));

        it('getAuthWellKnownEndPoints stored the result if http cal is made', async(() => {
            const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsFromUrl').and.returnValue(of({ issuer: 'anything' }));
            spyOnProperty(storagePersistanceService, 'authWellKnownEndPoints', 'get').and.returnValue(null);
            const storeSpy = spyOn(service, 'storeWellKnownEndpoints');
            service.getAuthWellKnownEndPoints('any-url').subscribe((result) => {
                expect(dataServiceSpy).toHaveBeenCalled();
                expect(storeSpy).toHaveBeenCalled();
                expect(result).toEqual({ issuer: 'anything' });
            });
        }));
    });
});
