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
import { TokenValidationService } from '../../validation/token-validation.service';
import { TokenValidationServiceMock } from '../../validation/token-validation.service-mock';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { FlowsDataServiceMock } from '../flows-data.service-mock';
import { CodeFlowCallbackHandlerService } from './code-flow-callback-handler.service';

describe('CodeFlowCallbackHandlerService', () => {
  let service: CodeFlowCallbackHandlerService;
  let dataService: DataService;
  let storagePersistanceService: StoragePersistanceService;
  let tokenValidationService: TokenValidationService;
  let configurationProvider: ConfigurationProvider;
  let urlService: UrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CodeFlowCallbackHandlerService,
        { provide: UrlService, useClass: UrlServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: TokenValidationService, useClass: TokenValidationServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
        { provide: DataService, useClass: DataServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(CodeFlowCallbackHandlerService);
    dataService = TestBed.inject(DataService);
    urlService = TestBed.inject(UrlService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    tokenValidationService = TestBed.inject(TokenValidationService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('codeFlowCallback', () => {
    it(
      'throws error if no state is given',
      waitForAsync(() => {
        const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
        getUrlParameterSpy.withArgs('any-url', 'state').and.returnValue(null);

        (service as any).codeFlowCallback('any-url').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'throws error if no code is given',
      waitForAsync(() => {
        const getUrlParameterSpy = spyOn(urlService, 'getUrlParameter').and.returnValue('params');
        getUrlParameterSpy.withArgs('any-url', 'code').and.returnValue(null);

        (service as any).codeFlowCallback('any-url').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'returns callbackContext if all params are good',
      waitForAsync(() => {
        spyOn(urlService, 'getUrlParameter').and.returnValue('params');

        const expectedCallbackContext = {
          code: 'params',
          refreshToken: null,
          state: 'params',
          sessionState: 'params',
          authResult: null,
          isRenewProcess: false,
          jwtKeys: null,
          validationResult: null,
          existingIdToken: null,
        };

        (service as any).codeFlowCallback('any-url').subscribe((callbackContext) => {
          expect(callbackContext).toEqual(expectedCallbackContext);
        });
      })
    );
  });

  describe('codeFlowCodeRequest ', () => {
    it(
      'throws error if state is not correct',
      waitForAsync(() => {
        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(false);

        service.codeFlowCodeRequest({} as CallbackContext).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'throws error if no tokenEndpoint is given',
      waitForAsync(() => {
        service.codeFlowCodeRequest({} as CallbackContext).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'calls dataservice if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.codeFlowCodeRequest({} as CallbackContext).subscribe((callbackContext) => {
          expect(postSpy).toHaveBeenCalledWith('tokenEndpoint', '', jasmine.any(HttpHeaders));
        });
      })
    );

    it(
      'calls dataservice with correct headers if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.codeFlowCodeRequest({} as CallbackContext).subscribe((callbackContext) => {
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

        service.codeFlowCodeRequest({} as CallbackContext).subscribe({
          error: (err) => {
            console.log(err);
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });
});
