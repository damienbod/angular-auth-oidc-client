import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { defer, firstValueFrom, of, throwError } from 'rxjs';
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

    it('throws error if no tokenEndpoint is given', async () => {
      try {
        await firstValueFrom(
          (service as any).refreshTokensRequestTokens({} as CallbackContext)
        );
        expect.fail('expected an error');
      } catch (err: unknown) {
        expect(err).toBeTruthy();
      }
    });

    it('calls data service if all params are good', async () => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of({}));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      await firstValueFrom(
        service.refreshTokensRequestTokens({} as CallbackContext, {
          configId: 'configId1',
        })
      );

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        'tokenEndpoint',
        undefined,
        { configId: 'configId1' },
        expect.any(HttpHeaders)
      );
      const httpHeaders = vi.mocked(postSpy).mock.lastCall![3] as HttpHeaders;

      expect(httpHeaders.has('Content-Type')).toBe(true);
      expect(httpHeaders.get('Content-Type')).toBe(
        'application/x-www-form-urlencoded'
      );
    });

    it('calls data service with correct headers if all params are good', async () => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of({}));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      await firstValueFrom(
        service.refreshTokensRequestTokens({} as CallbackContext, {
          configId: 'configId1',
        })
      );

      const httpHeaders = vi.mocked(postSpy).mock.lastCall![3] as HttpHeaders;

      expect(httpHeaders.has('Content-Type')).toBe(true);
      expect(httpHeaders.get('Content-Type')).toBe(
        'application/x-www-form-urlencoded'
      );
    });

    it('returns error in case of http error', async () => {
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

      await expect(
        firstValueFrom(
          service.refreshTokensRequestTokens({} as CallbackContext, config)
        )
      ).rejects.toThrow('OidcService code request authority');
    });

    it('retries request in case of no connection http error and succeeds', async () => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(
        createRetriableStream(
          throwError(() => CONNECTION_ERROR),
          of({})
        )
      );
      const config = {
        configId: 'configId1',
        authority: 'authority',
        refreshTokenMaxRetries: 1,
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      const res = await firstValueFrom(
        service.refreshTokensRequestTokens({} as CallbackContext, config)
      );

      expect(res).toBeTruthy();
      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    it('retries request in case of no connection http error and fails because of http error afterwards', async () => {
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

      try {
        await firstValueFrom(
          service.refreshTokensRequestTokens({} as CallbackContext, config)
        );
        expect.fail('expected an error');
      } catch (err: unknown) {
        expect(err).toBeTruthy();
        expect(postSpy).toHaveBeenCalledTimes(1);
      }
    });

    it('limits network error retries and preserves the original error', async () => {
      let requestCount = 0;

      vi.spyOn(dataService, 'post').mockReturnValue(
        defer(() => {
          requestCount++;

          return throwError(() => CONNECTION_ERROR);
        })
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        tokenEndpoint: 'tokenEndpoint',
      });

      await expect(
        firstValueFrom(
          service.refreshTokensRequestTokens({} as CallbackContext, {
            authority: 'authority',
            configId: 'configId1',
            refreshTokenMaxRetries: 2,
            refreshTokenRetryInSeconds: 0,
          })
        )
      ).rejects.toBe(CONNECTION_ERROR);

      expect(requestCount).toBe(3);
    });

    it('does not retry network errors when refreshTokenMaxRetries is zero', async () => {
      let requestCount = 0;

      vi.spyOn(dataService, 'post').mockReturnValue(
        defer(() => {
          requestCount++;

          return throwError(() => CONNECTION_ERROR);
        })
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        tokenEndpoint: 'tokenEndpoint',
      });

      await expect(
        firstValueFrom(
          service.refreshTokensRequestTokens({} as CallbackContext, {
            authority: 'authority',
            configId: 'configId1',
            refreshTokenMaxRetries: 0,
          })
        )
      ).rejects.toBe(CONNECTION_ERROR);

      expect(requestCount).toBe(1);
    });
  });
});
