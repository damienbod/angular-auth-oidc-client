import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { EventTypes } from '../../public-events/event-types';
import { PublicEventsService } from '../../public-events/public-events.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownService } from './auth-well-known.service';

describe('AuthWellKnownService', () => {
  let service: AuthWellKnownService;
  let dataService: AuthWellKnownDataService;
  let storagePersistenceService: StoragePersistenceService;
  let publicEventsService: PublicEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthWellKnownService,
        PublicEventsService,
        mockProvider(AuthWellKnownDataService),
        mockProvider(StoragePersistenceService),
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
    it('getAuthWellKnownEndPoints throws an error if not config provided', waitForAsync(() => {
      service.queryAndStoreAuthWellKnownEndPoints(null).subscribe({
        error: (error) => {
          expect(error).toEqual(
            new Error(
              'Please provide a configuration before setting up the module'
            )
          );
        },
      });
    }));

    it('calls dataservice when no explicit endpoints are configured', waitForAsync(() => {
      const dataServiceSpy = spyOn(
        dataService,
        'getWellKnownEndPointsForConfig'
      ).and.returnValue(of({ issuer: 'anything' }));

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
        .and.returnValue({ issuer: 'anything' });

      service
        .queryAndStoreAuthWellKnownEndPoints({ configId: 'configId1' })
        .subscribe((result) => {
          expect(storagePersistenceService.read).not.toHaveBeenCalled();
          expect(dataServiceSpy).toHaveBeenCalled();
          expect(result).toEqual({ issuer: 'anything' });
        });
    }));

    it('getAuthWellKnownEndPoints stored the result if http call is made', waitForAsync(() => {
      const dataServiceSpy = spyOn(
        dataService,
        'getWellKnownEndPointsForConfig'
      ).and.returnValue(of({ issuer: 'anything' }));

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
        .and.returnValue(null);
      const storeSpy = spyOn(service, 'storeWellKnownEndpoints');

      service
        .queryAndStoreAuthWellKnownEndPoints({ configId: 'configId1' })
        .subscribe((result) => {
          expect(dataServiceSpy).toHaveBeenCalled();
          expect(storeSpy).toHaveBeenCalled();
          expect(result).toEqual({ issuer: 'anything' });
        });
    }));

    it('throws `ConfigLoadingFailed` event when error happens from http', waitForAsync(() => {
      spyOn(dataService, 'getWellKnownEndPointsForConfig').and.returnValue(
        throwError(() => new Error('error'))
      );
      const publicEventsServiceSpy = spyOn(publicEventsService, 'fireEvent');

      service
        .queryAndStoreAuthWellKnownEndPoints({ configId: 'configId1' })
        .subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
            expect(publicEventsServiceSpy).toHaveBeenCalledTimes(1);
            expect(publicEventsServiceSpy).toHaveBeenCalledOnceWith(
              EventTypes.ConfigLoadingFailed,
              null
            );
          },
        });
    }));

    it('does not call dataservice when authWellknownEndpoints is explicitly configured', waitForAsync(() => {
      const explicitEndpoints = { issuer: 'https://explicit.example.com', tokenEndpoint: 'https://explicit.example.com/token' };
      const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsForConfig');

      service
        .queryAndStoreAuthWellKnownEndPoints({
          configId: 'configId1',
          authWellknownEndpoints: explicitEndpoints,
        })
        .subscribe((result) => {
          expect(dataServiceSpy).not.toHaveBeenCalled();
          expect(result).toEqual(explicitEndpoints);
        });
    }));

    it('stores and returns explicit endpoints without discovery request', waitForAsync(() => {
      const explicitEndpoints = { issuer: 'https://explicit.example.com', tokenEndpoint: 'https://explicit.example.com/token' };
      const storeSpy = spyOn(service, 'storeWellKnownEndpoints');

      spyOn(dataService, 'getWellKnownEndPointsForConfig');

      service
        .queryAndStoreAuthWellKnownEndPoints({
          configId: 'configId1',
          authWellknownEndpoints: explicitEndpoints,
        })
        .subscribe((result) => {
          expect(storeSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({ configId: 'configId1' }),
            explicitEndpoints
          );
          expect(result).toEqual(explicitEndpoints);
        });
    }));

    it('always fetches fresh endpoints in discovery mode, ignoring previously stored values', waitForAsync(() => {
      const freshEndpoints = { issuer: 'https://server.example.com', tokenEndpoint: 'https://server.example.com/token/fresh' };
      const dataServiceSpy = spyOn(dataService, 'getWellKnownEndPointsForConfig').and.returnValue(of(freshEndpoints));
      const storeSpy = spyOn(service, 'storeWellKnownEndpoints');

      // config has NO explicit authWellknownEndpoints → discovery path
      service
        .queryAndStoreAuthWellKnownEndPoints({ configId: 'configId1' })
        .subscribe((result) => {
          expect(dataServiceSpy).toHaveBeenCalled();
          expect(storeSpy).toHaveBeenCalledOnceWith(
            jasmine.objectContaining({ configId: 'configId1' }),
            freshEndpoints
          );
          expect(result).toEqual(freshEndpoints);
        });
    }));
  });
});
