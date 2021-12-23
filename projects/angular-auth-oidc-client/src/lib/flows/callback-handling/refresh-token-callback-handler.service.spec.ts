import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
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
        { provide: UrlService, useClass: mockClass(UrlService) },
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: DataService, useClass: mockClass(DataService) },
        { provide: StoragePersistenceService, useClass: mockClass(StoragePersistenceService) },
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

    it(
      'throws error if no tokenEndpoint is given',
      waitForAsync(() => {
        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'calls data service if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.refreshTokensRequestTokens({} as CallbackContext, { configId: 'configId1' }).subscribe((callbackContext) => {
          expect(postSpy).toHaveBeenCalledOnceWith('tokenEndpoint', undefined, { configId: 'configId1' }, jasmine.any(HttpHeaders));
          const httpHeaders = postSpy.calls.mostRecent().args[3] as HttpHeaders;
          expect(httpHeaders.has('Content-Type')).toBeTrue();
          expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
        });
      })
    );

    it(
      'calls data service with correct headers if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.refreshTokensRequestTokens({} as CallbackContext, { configId: 'configId1' }).subscribe((callbackContext) => {
          const httpHeaders = postSpy.calls.mostRecent().args[3] as HttpHeaders;
          expect(httpHeaders.has('Content-Type')).toBeTrue();
          expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
        });
      })
    );

    it(
      'returns error in case of http error',
      waitForAsync(() => {
        spyOn(dataService, 'post').and.returnValue(throwError(() => HTTP_ERROR));
        const config = { configId: 'configId1', authority: 'authority' };
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.refreshTokensRequestTokens({} as CallbackContext, config).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'retries request in case of no connection http error and succeeds',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => CONNECTION_ERROR),
            of({})
          )
        );
        const config = { configId: 'configId1', authority: 'authority' };
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.refreshTokensRequestTokens({} as CallbackContext, config).subscribe({
          next: (res) => {
            expect(res).toBeTruthy();
            expect(postSpy).toHaveBeenCalledTimes(1);
          },
          error: (err) => {
            // fails if there should be a result
            expect(err).toBeFalsy();
          },
        });
      })
    );

    it(
      'retries request in case of no connection http error and fails because of http error afterwards',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => CONNECTION_ERROR),
            throwError(() => HTTP_ERROR)
          )
        );
        const config = { configId: 'configId1', authority: 'authority' };
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.refreshTokensRequestTokens({} as CallbackContext, config).subscribe({
          next: (res) => {
            // fails if there should be a result
            expect(res).toBeFalsy();
          },
          error: (err) => {
            expect(err).toBeTruthy();
            expect(postSpy).toHaveBeenCalledTimes(1);
          },
        });
      })
    );
  });
});
