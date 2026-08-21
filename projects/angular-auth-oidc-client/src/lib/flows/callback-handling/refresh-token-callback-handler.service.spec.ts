import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { createRetriableStream } from '../../../test/create-retriable-stream.helper';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { CallbackContext } from '../callback-context';
import { RefreshTokenCallbackHandlerService } from './refresh-token-callback-handler.service';

describe('RefreshTokenCallbackHandlerService', () => {
  let service: RefreshTokenCallbackHandlerService;
  let storagePersistenceService: StoragePersistenceService;
  let dataService: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RefreshTokenCallbackHandlerService,
        mockProvider(UrlService),
        mockProvider(LoggerService),
        mockProvider(DataService),
        mockProvider(StoragePersistenceService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(RefreshTokenCallbackHandlerService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    dataService = TestBed.inject(DataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('refreshTokensRequestTokens', () => {
    const HTTP_ERROR = new HttpErrorResponse({});
    const CONNECTION_ERROR = new HttpErrorResponse({
      error: new ProgressEvent('error'),
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://identity-server.test/openid-connect/token',
    });

    it('throws error if no tokenEndpoint is given', waitForAsync(() => {
      (service as any)
        .refreshTokensRequestTokens({} as CallbackContext)
        .subscribe({
          error: (err: unknown) => {
            expect(err).toBeTruthy();
          },
        });
    }));

    it('calls data service if all params are good', waitForAsync(() => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of({}));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      service
        .refreshTokensRequestTokens({} as CallbackContext, {
          configId: 'configId1',
        })
        .subscribe(() => {
          expect(postSpy).toHaveBeenCalledTimes(1);
          expect(postSpy).toHaveBeenCalledWith(
            'tokenEndpoint',
            undefined,
            { configId: 'configId1' },
            expect.any(HttpHeaders)
          );
          const httpHeaders = vi.mocked(postSpy).mock
            .lastCall![3] as HttpHeaders;

          expect(httpHeaders.has('Content-Type')).toBe(true);
          expect(httpHeaders.get('Content-Type')).toBe(
            'application/x-www-form-urlencoded'
          );
        });
    }));

    it('calls data service with correct headers if all params are good', waitForAsync(() => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of({}));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      service
        .refreshTokensRequestTokens({} as CallbackContext, {
          configId: 'configId1',
        })
        .subscribe(() => {
          const httpHeaders = vi.mocked(postSpy).mock
            .lastCall![3] as HttpHeaders;

          expect(httpHeaders.has('Content-Type')).toBe(true);
          expect(httpHeaders.get('Content-Type')).toBe(
            'application/x-www-form-urlencoded'
          );
        });
    }));

    it('returns error in case of http error', waitForAsync(() => {
      vi.spyOn(dataService, 'post').mockReturnValue(
        throwError(() => HTTP_ERROR)
      );
      const config = { configId: 'configId1', authority: 'authority' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      service
        .refreshTokensRequestTokens({} as CallbackContext, config)
        .subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
    }));

    it('retries request in case of no connection http error and succeeds', waitForAsync(() => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(
        createRetriableStream(
          throwError(() => CONNECTION_ERROR),
          of({})
        )
      );
      const config = { configId: 'configId1', authority: 'authority' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      service
        .refreshTokensRequestTokens({} as CallbackContext, config)
        .subscribe({
          next: (res) => {
            expect(res).toBeTruthy();
            expect(postSpy).toHaveBeenCalledTimes(1);
          },
          error: (err) => {
            // fails if there should be a result
            expect(err).toBeFalsy();
          },
        });
    }));

    it('retries request in case of no connection http error and fails because of http error afterwards', waitForAsync(() => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(
        createRetriableStream(
          throwError(() => CONNECTION_ERROR),
          throwError(() => HTTP_ERROR)
        )
      );
      const config = { configId: 'configId1', authority: 'authority' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      service
        .refreshTokensRequestTokens({} as CallbackContext, config)
        .subscribe({
          next: (res) => {
            // fails if there should be a result
            expect(res).toBeFalsy();
          },
          error: (err) => {
            expect(err).toBeTruthy();
            expect(postSpy).toHaveBeenCalledTimes(1);
          },
        });
    }));
  });
});
