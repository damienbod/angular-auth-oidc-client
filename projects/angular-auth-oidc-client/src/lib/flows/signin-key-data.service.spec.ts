import { async, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { SigninKeyDataService } from './signin-key-data.service';

describe('Signin Key Data Service', () => {
    let service: SigninKeyDataService;
    let storagePersistanceService: StoragePersistanceService;
    let dataService: DataService;
    let loggerService: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SigninKeyDataService,
                { provide: DataService, useClass: DataServiceMock },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(SigninKeyDataService);
        storagePersistanceService = TestBed.inject(StoragePersistanceService);
        dataService = TestBed.inject(DataService);
        loggerService = TestBed.inject(LoggerService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });

    describe('getSigningKeys', () => {
        it('throws error when no wellknownendpoints given', async(() => {
            spyOnProperty(storagePersistanceService, 'authWellKnownEndPoints').and.returnValue(null);
            const result = service.getSigningKeys();

            result.subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('throws error when no jwksUri given', async(() => {
            spyOnProperty(storagePersistanceService, 'authWellKnownEndPoints').and.returnValue({ jwksUri: null });
            const result = service.getSigningKeys();

            result.subscribe({
                error: (err) => {
                    expect(err).toBeTruthy();
                },
            });
        }));

        it('calls dataservice if jwksurl is given', async(() => {
            spyOnProperty(storagePersistanceService, 'authWellKnownEndPoints').and.returnValue({ jwksUri: 'someUrl' });
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

    describe('handleErrorGetSigningKeys', () => {
        it('keeps observable if error is catched', async(() => {
            const result = (service as any).handleErrorGetSigningKeys(new Response());

            expect(result).toEqual(jasmine.any(Observable));
        }));

        it('loggs error if error is response', async(() => {
            const logSpy = spyOn(loggerService, 'logError');
            (service as any).handleErrorGetSigningKeys(new Response(null, { status: 400, statusText: 'nono' }));
            expect(logSpy).toHaveBeenCalledWith('400 - nono {}');
        }));

        it('loggs error if error is not a response', async(() => {
            const logSpy = spyOn(loggerService, 'logError');
            (service as any).handleErrorGetSigningKeys('Just some Error');
            expect(logSpy).toHaveBeenCalledWith('Just some Error');
        }));

        it('loggs error if error with message property is not a response', async(() => {
            const logSpy = spyOn(loggerService, 'logError');
            (service as any).handleErrorGetSigningKeys({ message: 'Just some Error' });
            expect(logSpy).toHaveBeenCalledWith('Just some Error');
        }));
    });
});
