import { HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { UrlService } from '../../utils/url/url.service';
import { DataServiceMock } from './../../api/data.service-mock';
import { StoragePersistanceServiceMock } from './../../storage/storage-persistance.service-mock';
import { UrlServiceMock } from './../../utils/url/url.service-mock';
import { ParService } from './par.service';

describe('ParService', () => {
  let service: ParService;
  let loggerService: LoggerService;
  let urlService: UrlService;
  let dataService: DataService;
  let storagePersistanceService: StoragePersistanceService;

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
          provide: StoragePersistanceService,
          useClass: StoragePersistanceServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ParService);
    dataService = TestBed.inject(DataService);
    loggerService = TestBed.inject(LoggerService);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
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
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue(null);
        service.postParRequest().subscribe({
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
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ some: 'thing' });
        service.postParRequest().subscribe({
          error: (err) => {
            expect(err).toBe('Could not read PAR endpoint from authWellKnownEndpoints');
          },
        });
      })
    );

    it(
      'calls data service with correct params',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url');
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ parEndpoint: 'parEndpoint' });
        const dataServiceSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        service.postParRequest().subscribe(() => {
          expect(dataServiceSpy).toHaveBeenCalledOnceWith('parEndpoint', 'some-url', jasmine.any(HttpHeaders));
        });
      })
    );

    it(
      'Gives back correct object properties',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url');
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(of({ expires_in: 123, request_uri: 'request_uri' }));
        service.postParRequest().subscribe((result) => {
          expect(result).toEqual({ expiresIn: 123, requestUri: 'request_uri' });
        });
      })
    );

    it(
      'throws error if data service has got an error',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('some-url');
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ parEndpoint: 'parEndpoint' });
        spyOn(dataService, 'post').and.returnValue(throwError('AN ERROR'));
        const loggerSpy = spyOn(loggerService, 'logError');

        service.postParRequest().subscribe({
          error: (err) => {
            expect(err).toBe('There was an error on ParService postParRequest');
            expect(loggerSpy).toHaveBeenCalledOnceWith('There was an error on ParService postParRequest', 'AN ERROR');
          },
        });
      })
    );
  });
});
