import { HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { createRetriableStream } from '../../../test/create-retriable-stream.helper';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { StoragePersistenceServiceMock } from '../../storage/storage-persistence-service-mock.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { DataServiceMock } from './../../api/data.service-mock';
import { UrlServiceMock } from './../../utils/url/url.service-mock';
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
          useClass: LoggerServiceMock,
        },
        {
          provide: UrlService,
          useClass: UrlServiceMock,
        },
        {
          provide: DataService,
          useClass: DataServiceMock,
        },
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
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
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
        service.postParRequest('configId').subscribe({
          error: (err) => {
            expect(err).toBe('Could not read PAR endpoint because authWellKnownEndPoints are not given');
          },
        });
      })
    );

    it(
      'throws error if par endpoint does not exist in storage',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(null);
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ some: 'thing' });
        service.postParRequest('configId').subscribe({
          error: (err) => {
            expect(err).toBe('Could not read PAR endpoint from authWellKnownEndpoints');
          },
        });
      })
    );

    it(
      'calls data service with correct params',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url123');
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', 'configId')
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        const dataServiceSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        service.postParRequest('configId').subscribe(() => {
          expect(dataServiceSpy).toHaveBeenCalledOnceWith('parEndpoint', 'some-url123', jasmine.any(HttpHeaders));
        });
      })
    );

    it(
      'Gives back correct object properties',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url456');
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', 'configId')
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(of({ expires_in: 123, request_uri: 'request_uri' }));
        service.postParRequest('configId').subscribe((result) => {
          expect(result).toEqual({ expiresIn: 123, requestUri: 'request_uri' });
        });
      })
    );

    it(
      'throws error if data service has got an error',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url789');
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', 'configId')
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(throwError('AN ERROR'));
        const loggerSpy = spyOn(loggerService, 'logError');

        service.postParRequest('configId').subscribe({
          error: (err) => {
            expect(err).toBe('There was an error on ParService postParRequest');
            expect(loggerSpy).toHaveBeenCalledOnceWith('There was an error on ParService postParRequest', 'AN ERROR');
          },
        });
      })
    );

    it(
      'should retry once',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url456');
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', 'configId')
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(throwError({}), of({ expires_in: 123, request_uri: 'request_uri' }))
        );

        service.postParRequest('configId').subscribe({
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
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url456');
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', 'configId')
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(throwError({}), throwError({}), of({ expires_in: 123, request_uri: 'request_uri' }))
        );

        service.postParRequest('configId').subscribe({
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
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url456');
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', 'configId')
          .and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(throwError({}), throwError({}), throwError({}), of({ expires_in: 123, request_uri: 'request_uri' }))
        );

        service.postParRequest('configId').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });
});
