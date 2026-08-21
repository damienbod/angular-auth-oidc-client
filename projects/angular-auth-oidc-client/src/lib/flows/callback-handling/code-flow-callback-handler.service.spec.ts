import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
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
        mockProvider(UrlService),
        mockProvider(LoggerService),
        mockProvider(TokenValidationService),
        mockProvider(FlowsDataService),
        mockProvider(StoragePersistenceService),
        mockProvider(DataService),
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
    it('throws error if no state is given', async () => {
      vi.spyOn(urlService, 'getUrlParameter').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'test-url' && args[1] === 'state') {
            return '';
          }

          return 'params';
        }
      );

      await expect(
        firstValueFrom(
          service.codeFlowCallback('test-url', { configId: 'configId1' })
        )
      ).rejects.toBeTruthy();
    });

    it('throws error if no code is given', async () => {
      vi.spyOn(urlService, 'getUrlParameter').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'test-url' && args[1] === 'code') {
            return '';
          }

          return 'params';
        }
      );

      await expect(
        firstValueFrom(
          service.codeFlowCallback('test-url', { configId: 'configId1' })
        )
      ).rejects.toBeTruthy();
    });

    it('returns callbackContext if all params are good', async () => {
      vi.spyOn(urlService, 'getUrlParameter').mockReturnValue('params');

      const expectedCallbackContext = {
        code: 'params',
        refreshToken: '',
        state: 'params',
        sessionState: 'params',
        authResult: null,
        isRenewProcess: false,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: null,
      } as CallbackContext;
      const callbackContext = await firstValueFrom(
        service.codeFlowCallback('test-url', { configId: 'configId1' })
      );

      expect(callbackContext).toEqual(expectedCallbackContext);
    });
  });

  describe('codeFlowCodeRequest ', () => {
    const HTTP_ERROR = new HttpErrorResponse({});
    const CONNECTION_ERROR = new HttpErrorResponse({
      error: new ProgressEvent('error'),
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://identity-server.test/openid-connect/token',
    });

    it('throws error if state is not correct', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(false);

      await expect(
        firstValueFrom(
          service.codeFlowCodeRequest({} as CallbackContext, {
            configId: 'configId1',
          })
        )
      ).rejects.toBeTruthy();
    });

    it('throws error if authWellknownEndpoints is null is given', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );

      await expect(
        firstValueFrom(
          service.codeFlowCodeRequest({} as CallbackContext, {
            configId: 'configId1',
          })
        )
      ).rejects.toBeTruthy();
    });

    it('throws error if tokenendpoint is null is given', async () => {
      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: null };
          }

          return undefined;
        }
      );

      await expect(
        firstValueFrom(
          service.codeFlowCodeRequest({} as CallbackContext, {
            configId: 'configId1',
          })
        )
      ).rejects.toBeTruthy();
    });

    it('calls dataService if all params are good', async () => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of({}));

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      await firstValueFrom(
        service.codeFlowCodeRequest({} as CallbackContext, {
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
    });

    it('calls url service with custom token params', async () => {
      const urlServiceSpy = vi
        .spyOn(urlService, 'createBodyForCodeFlowCodeRequest')
        .mockReturnValue(undefined as any);
      const config = {
        configId: 'configId1',
        customParamsCodeRequest: { foo: 'bar' },
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of({}));

      await firstValueFrom(
        service.codeFlowCodeRequest({ code: 'foo' } as CallbackContext, config)
      );

      expect(urlServiceSpy).toHaveBeenCalledTimes(1);
      expect(urlServiceSpy).toHaveBeenCalledWith('foo', config, {
        foo: 'bar',
      });
      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    it('calls dataService with correct headers if all params are good', async () => {
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of({}));
      const config = {
        configId: 'configId1',
        customParamsCodeRequest: { foo: 'bar' },
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      await firstValueFrom(
        service.codeFlowCodeRequest({} as CallbackContext, config)
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
      const config = {
        configId: 'configId1',
        customParamsCodeRequest: { foo: 'bar' },
        authority: 'authority',
      };

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
          service.codeFlowCodeRequest({} as CallbackContext, config)
        )
      ).rejects.toBeTruthy();
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
        customParamsCodeRequest: { foo: 'bar' },
        authority: 'authority',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      const res = await firstValueFrom(
        service.codeFlowCodeRequest({} as CallbackContext, config)
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
      const config = {
        configId: 'configId1',
        customParamsCodeRequest: { foo: 'bar' },
        authority: 'authority',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { tokenEndpoint: 'tokenEndpoint' };
          }

          return undefined;
        }
      );

      vi.spyOn(
        tokenValidationService,
        'validateStateFromHashCallback'
      ).mockReturnValue(true);

      await expect(
        firstValueFrom(
          service.codeFlowCodeRequest({} as CallbackContext, config)
        )
      ).rejects.toBeTruthy();
      expect(postSpy).toHaveBeenCalledTimes(1);
    });
  });
});
