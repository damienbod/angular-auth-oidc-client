import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
import { createRetriableStream } from '../../../test/create-retriable-stream.helper';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { UrlService } from '../../utils/url/url.service';
import { TokenValidationService } from '../../validation/token-validation.service';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { CodeFlowCallbackHandlerService } from './code-flow-callback-handler.service';

describe('CodeFlowCallbackHandlerService', () => {
  let service: CodeFlowCallbackHandlerService;
  let dataService: DataService;
  let storagePersistenceService: StoragePersistenceService;
  let tokenValidationService: TokenValidationService;
  let urlService: UrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CodeFlowCallbackHandlerService,
        { provide: UrlService, useClass: mockClass(UrlService) },
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: TokenValidationService, useClass: mockClass(TokenValidationService) },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
        { provide: StoragePersistenceService, useClass: mockClass(StoragePersistenceService) },
        { provide: DataService, useClass: mockClass(DataService) },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(CodeFlowCallbackHandlerService);
    dataService = TestBed.inject(DataService);
    urlService = TestBed.inject(UrlService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
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

        service.codeFlowCallback('any-url', { configId: 'configId1' }).subscribe({
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

        service.codeFlowCallback('any-url', { configId: 'configId1' }).subscribe({
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

        service.codeFlowCallback('any-url', { configId: 'configId1' }).subscribe((callbackContext) => {
          expect(callbackContext).toEqual(expectedCallbackContext);
        });
      })
    );
  });

  describe('codeFlowCodeRequest ', () => {
    const HTTP_ERROR = new HttpErrorResponse({});
    const CONNECTION_ERROR = new HttpErrorResponse({
      error: new ProgressEvent('error'),
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://identity-server.test/openid-connect/token',
    });

    it(
      'throws error if state is not correct',
      waitForAsync(() => {
        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(false);

        service.codeFlowCodeRequest({} as CallbackContext, { configId: 'configId1' }).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'throws error if authWellknownEndpoints is null is given',
      waitForAsync(() => {
        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', { configId: 'configId1' }).and.returnValue(null);

        service.codeFlowCodeRequest({} as CallbackContext, { configId: 'configId1' }).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'throws error if tokenendpoint is null is given',
      waitForAsync(() => {
        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(true);
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ tokenEndpoint: null });

        service.codeFlowCodeRequest({} as CallbackContext, { configId: 'configId1' }).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'calls dataService if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));

        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', { configId: 'configId1' })
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(true);

        service.codeFlowCodeRequest({} as CallbackContext, { configId: 'configId1' }).subscribe(() => {
          expect(postSpy).toHaveBeenCalledOnceWith('tokenEndpoint', undefined, { configId: 'configId1' }, jasmine.any(HttpHeaders));
        });
      })
    );

    it(
      'calls url service with custom token params',
      waitForAsync(() => {
        const urlServiceSpy = spyOn(urlService, 'createBodyForCodeFlowCodeRequest');
        const config = {
          configId: 'configId1',
          customParamsCodeRequest: { foo: 'bar' },
        };

        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(true);

        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));

        service.codeFlowCodeRequest({ code: 'foo' } as CallbackContext, config).subscribe(() => {
          expect(urlServiceSpy).toHaveBeenCalledOnceWith('foo', config, { foo: 'bar' });
          expect(postSpy).toHaveBeenCalledTimes(1);
        });
      })
    );

    it(
      'calls dataService with correct headers if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        const config = {
          configId: 'configId1',
          customParamsCodeRequest: { foo: 'bar' },
        };

        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(true);

        service.codeFlowCodeRequest({} as CallbackContext, config).subscribe(() => {
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
        const config = {
          configId: 'configId1',
          customParamsCodeRequest: { foo: 'bar' },
          authority: 'authority',
        };

        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        service.codeFlowCodeRequest({} as CallbackContext, config).subscribe({
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
        const config = {
          configId: 'configId1',
          customParamsCodeRequest: { foo: 'bar' },
          authority: 'authority',
        };

        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(true);

        service.codeFlowCodeRequest({} as CallbackContext, config).subscribe({
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
        const config = {
          configId: 'configId1',
          customParamsCodeRequest: { foo: 'bar' },
          authority: 'authority',
        };

        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        spyOn(tokenValidationService, 'validateStateFromHashCallback').and.returnValue(true);

        service.codeFlowCodeRequest({} as CallbackContext, config).subscribe({
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
