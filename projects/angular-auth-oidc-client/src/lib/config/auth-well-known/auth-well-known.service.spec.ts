import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence-service-mock.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { AuthWellKnownService } from './auth-well-known.service';
import { AuthWellKnownDataService } from './auth-well-known/auth-well-known-data.service';

describe('AuthWellKnownService', () => {
  let service: AuthWellKnownService;
  let dataService: AuthWellKnownDataService;
  let storagePersistenceService: StoragePersistenceService;
  let publicEventsService: PublicEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthWellKnownService,
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
        { provide: DataService, useClass: DataServiceMock },
        AuthWellKnownDataService,
        PublicEventsService,
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(AuthWellKnownService);
    dataService = TestBed.inject(AuthWellKnownDataService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    publicEventsService = TestBed.inject(PublicEventsService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuthWellKnownEndPoints', () => {
    it(
      'getAuthWellKnownEndPoints return stored endpoints if they exist',
      waitForAsync(() => {
        const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsFromUrl');
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ issuer: 'anything' });
        service.getAuthWellKnownEndPoints('any-url').subscribe((result) => {
          expect(dataServiceSpy).not.toHaveBeenCalled();
          expect(result).toEqual({ issuer: 'anything' });
        });
      })
    );

    it(
      'getAuthWellKnownEndPoints calls dataservice if none is stored',
      waitForAsync(() => {
        const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsFromUrl').and.returnValue(of({ issuer: 'anything' }));
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        service.getAuthWellKnownEndPoints('any-url').subscribe((result) => {
          expect(dataServiceSpy).toHaveBeenCalled();
          expect(result).toEqual({ issuer: 'anything' });
        });
      })
    );

    it(
      'getAuthWellKnownEndPoints stored the result if http cal is made',
      waitForAsync(() => {
        const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsFromUrl').and.returnValue(of({ issuer: 'anything' }));
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        const storeSpy = spyOn(service, 'storeWellKnownEndpoints');
        service.getAuthWellKnownEndPoints('any-url').subscribe((result) => {
          expect(dataServiceSpy).toHaveBeenCalled();
          expect(storeSpy).toHaveBeenCalled();
          expect(result).toEqual({ issuer: 'anything' });
        });
      })
    );

    it(
      'throws `ConfigLoadingFailed` event when error happens from http',
      waitForAsync(() => {
        spyOn(dataService, 'getWellKnownEndPointsFromUrl').and.returnValue(throwError('This is an error'));
        const publicEventsServiceSpy = spyOn(publicEventsService, 'fireEvent');
        service.getAuthWellKnownEndPoints('any-url').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
            expect(publicEventsServiceSpy).toHaveBeenCalledTimes(1);
            expect(publicEventsServiceSpy).toHaveBeenCalledWith(EventTypes.ConfigLoadingFailed, null);
          },
        });
      })
    );
  });
});
