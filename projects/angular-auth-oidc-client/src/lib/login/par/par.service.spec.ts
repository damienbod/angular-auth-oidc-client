import { HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { createRetriableStream } from '../../../test/create-retriable-stream.helper';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { ParService } from './par.service';

describe('ParService', () => {
  let service: ParService;
  let loggerService: LoggerService;
  let urlService: UrlService;
  let dataService: DataService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(LoggerService),
        mockProvider(UrlService),
        mockProvider(DataService),
        mockProvider(StoragePersistenceService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ParService);
    dataService = TestBed.inject(DataService);
    loggerService = TestBed.inject(LoggerService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    urlService = TestBed.inject(UrlService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('postParRequest', () => {
    it('throws error if authWellKnownEndPoints does not exist in storage', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of(null)
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );
      service.postParRequest({ configId: 'configId1' }).subscribe({
        error: (err) => {
          expect(err.message).toBe(
            'Could not read PAR endpoint because authWellKnownEndPoints are not given'
          );
        },
      });
    }));

    it('throws error if par endpoint does not exist in storage', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of(null)
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { some: 'thing' };
          }

          return undefined;
        }
      );
      service.postParRequest({ configId: 'configId1' }).subscribe({
        error: (err) => {
          expect(err.message).toBe(
            'Could not read PAR endpoint from authWellKnownEndpoints'
          );
        },
      });
    }));

    it('calls data service with correct params', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of('some-url123')
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { parEndpoint: 'parEndpoint' };
          }

          return undefined;
        }
      );

      const dataServiceSpy = vi
        .spyOn(dataService, 'post')
        .mockReturnValue(of({}));

      service.postParRequest({ configId: 'configId1' }).subscribe(() => {
        expect(dataServiceSpy).toHaveBeenCalledTimes(1);
        expect(dataServiceSpy).toHaveBeenCalledWith(
          'parEndpoint',
          'some-url123',
          { configId: 'configId1' },
          expect.any(HttpHeaders)
        );
      });
    }));

    it('Gives back correct object properties', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of('some-url456')
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { parEndpoint: 'parEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'post').mockReturnValue(
        of({ expires_in: 123, request_uri: 'request_uri' })
      );
      service.postParRequest({ configId: 'configId1' }).subscribe((result) => {
        expect(result).toEqual({ expiresIn: 123, requestUri: 'request_uri' });
      });
    }));

    it('throws error if data service has got an error', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of('some-url789')
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { parEndpoint: 'parEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'post').mockReturnValue(
        throwError(() => new Error('ERROR'))
      );
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      service.postParRequest({ configId: 'configId1' }).subscribe({
        error: (err) => {
          expect(err.message).toBe(
            'There was an error on ParService postParRequest'
          );
          expect(loggerSpy).toHaveBeenCalledTimes(1);
          expect(loggerSpy).toHaveBeenCalledWith(
            { configId: 'configId1' },
            'There was an error on ParService postParRequest',
            expect.any(Error)
          );
        },
      });
    }));

    it('should retry once', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of('some-url456')
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { parEndpoint: 'parEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'post').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('ERROR')),
          of({ expires_in: 123, request_uri: 'request_uri' })
        )
      );

      service.postParRequest({ configId: 'configId1' }).subscribe({
        next: (res) => {
          expect(res).toBeTruthy();
          expect(res).toEqual({ expiresIn: 123, requestUri: 'request_uri' });
        },
      });
    }));

    it('should retry twice', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of('some-url456')
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { parEndpoint: 'parEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'post').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('ERROR')),
          throwError(() => new Error('ERROR')),
          of({ expires_in: 123, request_uri: 'request_uri' })
        )
      );

      service.postParRequest({ configId: 'configId1' }).subscribe({
        next: (res) => {
          expect(res).toBeTruthy();
          expect(res).toEqual({ expiresIn: 123, requestUri: 'request_uri' });
        },
      });
    }));

    it('should fail after three tries', waitForAsync(() => {
      vi.spyOn(urlService, 'createBodyForParCodeFlowRequest').mockReturnValue(
        of('some-url456')
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { parEndpoint: 'parEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'post').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('ERROR')),
          throwError(() => new Error('ERROR')),
          throwError(() => new Error('ERROR')),
          of({ expires_in: 123, request_uri: 'request_uri' })
        )
      );

      service.postParRequest({ configId: 'configId1' }).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
        },
      });
    }));
  });
});
