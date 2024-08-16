import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { createRetriableStream } from '../../../test/create-retriable-stream.helper';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { AuthWellKnownDataService } from './auth-well-known-data.service';

const DUMMY_WELL_KNOWN_DOCUMENT = {
  issuer: 'https://identity-server.test/realms/main',
  authorization_endpoint:
    'https://identity-server.test/realms/main/protocol/openid-connect/auth',
  token_endpoint:
    'https://identity-server.test/realms/main/protocol/openid-connect/token',
  userinfo_endpoint:
    'https://identity-server.test/realms/main/protocol/openid-connect/userinfo',
  end_session_endpoint:
    'https://identity-server.test/realms/main/master/protocol/openid-connect/logout',
  jwks_uri:
    'https://identity-server.test/realms/main/protocol/openid-connect/certs',
  check_session_iframe:
    'https://identity-server.test/realms/main/protocol/openid-connect/login-status-iframe.html',
  introspection_endpoint:
    'https://identity-server.test/realms/main/protocol/openid-connect/token/introspect',
};

describe('AuthWellKnownDataService', () => {
  let service: AuthWellKnownDataService;
  let dataService: DataService;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthWellKnownDataService,
        mockProvider(DataService),
        mockProvider(LoggerService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(AuthWellKnownDataService);
    loggerService = TestBed.inject(LoggerService);
    dataService = TestBed.inject(DataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getWellKnownDocument', () => {
    it('should add suffix if it does not exist on current URL', waitForAsync(() => {
      const dataServiceSpy = spyOn(dataService, 'get').and.returnValue(
        of(null)
      );
      const urlWithoutSuffix = 'myUrl';
      const urlWithSuffix = `${urlWithoutSuffix}/.well-known/openid-configuration`;

      (service as any)
        .getWellKnownDocument(urlWithoutSuffix, { configId: 'configId1' })
        .subscribe(() => {
          expect(dataServiceSpy).toHaveBeenCalledOnceWith(urlWithSuffix, {
            configId: 'configId1',
          });
        });
    }));

    it('should not add suffix if it does exist on current url', waitForAsync(() => {
      const dataServiceSpy = spyOn(dataService, 'get').and.returnValue(
        of(null)
      );
      const urlWithSuffix = `myUrl/.well-known/openid-configuration`;

      (service as any)
        .getWellKnownDocument(urlWithSuffix, { configId: 'configId1' })
        .subscribe(() => {
          expect(dataServiceSpy).toHaveBeenCalledOnceWith(urlWithSuffix, {
            configId: 'configId1',
          });
        });
    }));

    it('should not add suffix if it does exist in the middle of current url', waitForAsync(() => {
      const dataServiceSpy = spyOn(dataService, 'get').and.returnValue(
        of(null)
      );
      const urlWithSuffix = `myUrl/.well-known/openid-configuration/and/some/more/stuff`;

      (service as any)
        .getWellKnownDocument(urlWithSuffix, { configId: 'configId1' })
        .subscribe(() => {
          expect(dataServiceSpy).toHaveBeenCalledOnceWith(urlWithSuffix, {
            configId: 'configId1',
          });
        });
    }));

    it('should use the custom suffix provided in the config', waitForAsync(() => {
      const dataServiceSpy = spyOn(dataService, 'get').and.returnValue(
        of(null)
      );
      const urlWithoutSuffix = `myUrl`;
      const urlWithSuffix = `${urlWithoutSuffix}/.well-known/test-openid-configuration`;

      (service as any)
        .getWellKnownDocument(urlWithoutSuffix, {
          configId: 'configId1',
          authWellknownUrlSuffix: '/.well-known/test-openid-configuration',
        })
        .subscribe(() => {
          expect(dataServiceSpy).toHaveBeenCalledOnceWith(urlWithSuffix, {
            configId: 'configId1',
            authWellknownUrlSuffix: '/.well-known/test-openid-configuration',
          });
        });
    }));

    it('should retry once', waitForAsync(() => {
      spyOn(dataService, 'get').and.returnValue(
        createRetriableStream(
          throwError(() => new Error('one')),
          of(DUMMY_WELL_KNOWN_DOCUMENT)
        )
      );

      (service as any)
        .getWellKnownDocument('anyurl', { configId: 'configId1' })
        .subscribe({
          next: (res: unknown) => {
            expect(res).toBeTruthy();
            expect(res).toEqual(DUMMY_WELL_KNOWN_DOCUMENT);
          },
        });
    }));

    it('should retry twice', waitForAsync(() => {
      spyOn(dataService, 'get').and.returnValue(
        createRetriableStream(
          throwError(() => new Error('one')),
          throwError(() => new Error('two')),
          of(DUMMY_WELL_KNOWN_DOCUMENT)
        )
      );

      (service as any)
        .getWellKnownDocument('anyurl', { configId: 'configId1' })
        .subscribe({
          next: (res: any) => {
            expect(res).toBeTruthy();
            expect(res).toEqual(DUMMY_WELL_KNOWN_DOCUMENT);
          },
        });
    }));

    it('should fail after three tries', waitForAsync(() => {
      spyOn(dataService, 'get').and.returnValue(
        createRetriableStream(
          throwError(() => new Error('one')),
          throwError(() => new Error('two')),
          throwError(() => new Error('three')),
          of(DUMMY_WELL_KNOWN_DOCUMENT)
        )
      );

      (service as any).getWellKnownDocument('anyurl', 'configId').subscribe({
        error: (err: unknown) => {
          expect(err).toBeTruthy();
        },
      });
    }));
  });

  describe('getWellKnownEndPointsForConfig', () => {
    it('calling internal getWellKnownDocument and maps', waitForAsync(() => {
      spyOn(dataService, 'get').and.returnValue(of({ jwks_uri: 'jwks_uri' }));

      const spy = spyOn(
        service as any,
        'getWellKnownDocument'
      ).and.callThrough();

      service
        .getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: 'any-url',
        })
        .subscribe((result) => {
          expect(spy).toHaveBeenCalled();
          expect((result as any).jwks_uri).toBeUndefined();
          expect(result.jwksUri).toBe('jwks_uri');
        });
    }));

    it('throws error and logs if no authwellknownUrl is given', waitForAsync(() => {
      const loggerSpy = spyOn(loggerService, 'logError');
      const config = {
        configId: 'configId1',
        authWellknownEndpointUrl: undefined,
      };

      service.getWellKnownEndPointsForConfig(config).subscribe({
        error: (error) => {
          expect(loggerSpy).toHaveBeenCalledOnceWith(
            config,
            'no authWellknownEndpoint given!'
          );
          expect(error.message).toEqual('no authWellknownEndpoint given!');
        },
      });
    }));
  });
});
