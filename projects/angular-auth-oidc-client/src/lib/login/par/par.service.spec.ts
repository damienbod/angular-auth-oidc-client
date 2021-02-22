import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { DataService } from '../../api/data.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { UrlService } from '../../utils/url/url.service';
import { DataServiceMock } from './../../api/data.service-mock';
import { ConfigurationProviderMock } from './../../config/config.provider-mock';
import { StoragePersistanceServiceMock } from './../../storage/storage-persistance.service-mock';
import { ParService } from './par.service';

describe('ParService', () => {
  let service: ParService;
  let loggerService: LoggerService;
  let urlService: UrlService;
  let configurationProvider: ConfigurationProvider;
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
          provide: DataService,
          useClass: DataServiceMock,
        },
        {
          provide: StoragePersistanceService,
          useClass: StoragePersistanceServiceMock,
        },
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ParService);
    dataService = TestBed.inject(DataService);
    loggerService = TestBed.inject(LoggerService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    urlService = TestBed.inject(UrlService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('postParRequest', () => {
    it(
      'returns ParResponse if all params are good',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue('ddd=ww&ee=3');
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ parEndpoint: 'https://par' });

        const expectedParResponse = {
          code: null,
          refreshToken: 'henlo-furiend',
        };

        spyOn(dataService, 'post').and.returnValue(of({ expectedParResponse }));

        (service as any).postParRequest().subscribe((parResult) => {
          expect(parResult).toEqual(expectedParResponse);
        });
      })
    );

    it(
      'throws error if par endpoint does not exist',
      waitForAsync(() => {
        spyOn(urlService, 'createBodyForParCodeFlowRequest').and.returnValue(null);
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ notSupported: 'thing' });
        spyOn(configurationProvider, 'hasValidConfig').and.returnValue(true);
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue('stsServer');
        const loggerSpy = spyOn(loggerService, 'logError');

        (service as any).postParRequest().subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
            expect(loggerSpy).toHaveBeenCalled();
          },
        });
      })
    );
  });
});
