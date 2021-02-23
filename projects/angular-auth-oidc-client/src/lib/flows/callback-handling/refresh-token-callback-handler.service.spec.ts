import { HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DataService } from '../../api/data.service';
import { DataServiceMock } from '../../api/data.service-mock';
import { ConfigurationProvider } from '../../config/config.provider';
import { ConfigurationProviderMock } from '../../config/config.provider-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { StoragePersistanceService } from '../../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../../storage/storage-persistance.service-mock';
import { UrlService } from '../../utils/url/url.service';
import { UrlServiceMock } from '../../utils/url/url.service-mock';
import { CallbackContext } from '../callback-context';
import { RefreshTokenCallbackHandlerService } from './refresh-token-callback-handler.service';

describe('RefreshTokenCallbackHandlerService', () => {
  let service: RefreshTokenCallbackHandlerService;
  let storagePersistanceService: StoragePersistanceService;
  let dataService: DataService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RefreshTokenCallbackHandlerService,
        { provide: UrlService, useClass: UrlServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: DataService, useClass: DataServiceMock },
        { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(RefreshTokenCallbackHandlerService);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    dataService = TestBed.inject(DataService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('refreshTokensRequestTokens', () => {
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
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
          expect(postSpy).toHaveBeenCalledWith('tokenEndpoint', '', jasmine.any(HttpHeaders));
          const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
          expect(httpHeaders.has('Content-Type')).toBeTrue();
          expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
        });
      })
    );

    it(
      'calls data service with correct headers if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
          const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
          expect(httpHeaders.has('Content-Type')).toBeTrue();
          expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
        });
      })
    );

    it(
      'returns error in case of http error',
      waitForAsync(() => {
        spyOn(dataService, 'post').and.returnValue(throwError({}));
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ stsServer: 'stsServer' });

        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });
});
