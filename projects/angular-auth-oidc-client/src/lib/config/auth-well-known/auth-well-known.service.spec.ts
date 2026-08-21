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

    it('getAuthWellKnownEndPoints calls always dataservice', waitForAsync(() => {
      const dataServiceSpy = vi
        .spyOn(dataService, 'getWellKnownEndPointsForConfig')
        .mockReturnValue(of({ issuer: 'anything' }));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { issuer: 'anything' };
          }

          return undefined;
        }
      );

      service
        .queryAndStoreAuthWellKnownEndPoints({ configId: 'configId1' })
        .subscribe((result) => {
          expect(storagePersistenceService.read).not.toHaveBeenCalled();
          expect(dataServiceSpy).toHaveBeenCalled();
          expect(result).toEqual({ issuer: 'anything' });
        });
    }));

    it('getAuthWellKnownEndPoints stored the result if http call is made', waitForAsync(() => {
      const dataServiceSpy = vi
        .spyOn(dataService, 'getWellKnownEndPointsForConfig')
        .mockReturnValue(of({ issuer: 'anything' }));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );
      const storeSpy = vi
        .spyOn(service, 'storeWellKnownEndpoints')
        .mockReturnValue(undefined);

      service
        .queryAndStoreAuthWellKnownEndPoints({ configId: 'configId1' })
        .subscribe((result) => {
          expect(dataServiceSpy).toHaveBeenCalled();
          expect(storeSpy).toHaveBeenCalled();
          expect(result).toEqual({ issuer: 'anything' });
        });
    }));

    it('throws `ConfigLoadingFailed` event when error happens from http', waitForAsync(() => {
      vi.spyOn(dataService, 'getWellKnownEndPointsForConfig').mockReturnValue(
        throwError(() => new Error('error'))
      );
      const publicEventsServiceSpy = vi
        .spyOn(publicEventsService, 'fireEvent')
        .mockReturnValue(undefined);

      service
        .queryAndStoreAuthWellKnownEndPoints({ configId: 'configId1' })
        .subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
            expect(publicEventsServiceSpy).toHaveBeenCalledTimes(1);
            expect(publicEventsServiceSpy).toHaveBeenCalledTimes(1);
            expect(publicEventsServiceSpy).toHaveBeenCalledWith(
              EventTypes.ConfigLoadingFailed,
              null
            );
          },
        });
    }));
  });
});
