import { HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
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
        ParService,
        {
          provide: LoggerService,
          useClass: mockClass(LoggerService),
        },
        {
          provide: UrlService,
          useClass: mockClass(UrlService),
        },
        {
          provide: DataService,
          useClass: mockClass(DataService),
        },
        {
          provide: StoragePersistenceService,
          useClass: mockClass(StoragePersistenceService),
        },
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
    it(
      'throws error if authWellKnownEndPoints does not exist in storage',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(null);
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', { configId: 'configId1' }).and.returnValue(null);
        service.postParRequest({ configId: 'configId1' }).subscribe({
          error: (err) => {
            expect(err.message).toBe('Could not read PAR endpoint because authWellKnownEndPoints are not given');
          },
        });
      })
    );

    it(
      'throws error if par endpoint does not exist in storage',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(null);
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ some: 'thing' });
        service.postParRequest({ configId: 'configId1' }).subscribe({
          error: (err) => {
            expect(err.message).toBe('Could not read PAR endpoint from authWellKnownEndpoints');
          },
        });
      })
    );

    it(
      'calls data service with correct params',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(of('some-url123'));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ parEndpoint: 'parEndpoint' });

        const dataServiceSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        service.postParRequest({ configId: 'configId1' }).subscribe(() => {
          expect(dataServiceSpy).toHaveBeenCalledOnceWith(
            'parEndpoint',
            'some-url123',
            { configId: 'configId1' },
            jasmine.any(HttpHeaders)
          );
        });
      })
    );

    it(
      'Gives back correct object properties',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(of('some-url456'));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(of({ expires_in: 123, request_uri: 'request_uri' }));
        service.postParRequest({ configId: 'configId1' }).subscribe((result) => {
          expect(result).toEqual({ expiresIn: 123, requestUri: 'request_uri' });
        });
      })
    );

    it(
      'throws error if data service has got an error',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(of('some-url789'));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(throwError(() => new Error('ERROR')));
        const loggerSpy = spyOn(loggerService, 'logError');

        service.postParRequest({ configId: 'configId1' }).subscribe({
          error: (err) => {
            expect(err.message).toBe('There was an error on ParService postParRequest');
            expect(loggerSpy).toHaveBeenCalledOnceWith(
              { configId: 'configId1' },
              'There was an error on ParService postParRequest',
              jasmine.any(Error)
            );
          },
        });
      })
    );

    it(
      'should retry once',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(of('some-url456'));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(
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
      })
    );

    it(
      'should retry twice',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(of('some-url456'));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(
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
      })
    );

    it(
      'should fail after three tries',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(of('some-url456'));
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(
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
      })
    );
  });
});
