import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { createRetriableStream } from '../../../test/create-retriable-stream.helper';
import { DataService } from '../../api/data.service';
import { LoggerService } from '../../logging/logger.service';
import { AuthWellKnownDataService } from './auth-well-known-data.service';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';

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
const DUMMY_MALICIOUS_URL = 'https://malicious.test/realms/main';

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
      spyOn(dataService, 'get').and.returnValue(of({
        issuer: 'localhost',
        jwks_uri: 'jwks_uri'
      }));

      const spy = spyOn(
        service as any,
        'getWellKnownDocument'
      ).and.callThrough();

      service
        .getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: 'localhost',
        })
        .subscribe((result) => {
          expect(spy).toHaveBeenCalled();
          expect((result as any).jwks_uri).toBeUndefined();
          expect(result.jwksUri).toBe('jwks_uri');
          expect(result.issuer).toBe('localhost');
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

    it('should merge the mapped endpoints with the provided endpoints', waitForAsync(() => {
      spyOn(dataService, 'get').and.returnValue(of(DUMMY_WELL_KNOWN_DOCUMENT));

      const expected: AuthWellKnownEndpoints = {
        endSessionEndpoint: 'config-endSessionEndpoint',
        revocationEndpoint: 'config-revocationEndpoint',
        jwksUri: DUMMY_WELL_KNOWN_DOCUMENT.jwks_uri
      };

      service
        .getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
          authWellknownEndpoints: {
            endSessionEndpoint: 'config-endSessionEndpoint',
            revocationEndpoint: 'config-revocationEndpoint',
          },
        })
        .subscribe((result) => {
          expect(result).toEqual(jasmine.objectContaining(expected));
        });
    }));

    it('throws error and logs if well known issuer does not match authwellknownUrl', waitForAsync(() => {
      const loggerSpy = spyOn(loggerService, 'logError');
      const maliciousWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_MALICIOUS_URL
      };

      spyOn(dataService, 'get').and.returnValue(
        createRetriableStream(
          of(maliciousWellKnown)
        )
      );

      const config = {
        configId: 'configId1',
        authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
      };

      service.getWellKnownEndPointsForConfig(config).subscribe({
        next: (result) => {
          fail(`Retrieval was supposed to fail. Well known endpoints returned : ${JSON.stringify(result)}`);
        },
        error: (error) => {
          expect(loggerSpy).toHaveBeenCalledOnceWith(
            config,
            `Issuer mismatch. Well known issuer ${DUMMY_MALICIOUS_URL} does not match configured well known url ${DUMMY_WELL_KNOWN_DOCUMENT.issuer}`
          );
          expect(error.message).toEqual(`Issuer mismatch. Well known issuer ${DUMMY_MALICIOUS_URL} does not match configured well known url ${DUMMY_WELL_KNOWN_DOCUMENT.issuer}`);
        }
      });
    }));

    it('throws no error if well known issuer does not match authwellknownUrl and validation is disabled', waitForAsync(() => {
      const loggerSpy = spyOn(loggerService, 'logError');
      const maliciousWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_MALICIOUS_URL
      };

      spyOn(dataService, 'get').and.returnValue(
        createRetriableStream(
          of(maliciousWellKnown)
        )
      );

      const config = {
        configId: 'configId1',
        authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
        strictIssuerValidationOnWellKnownRetrievalOff: true,
      };

      service.getWellKnownEndPointsForConfig(config).subscribe({
        next: (result) => {
          expect(result.issuer).toBe(DUMMY_MALICIOUS_URL);
          expect(loggerSpy).not.toHaveBeenCalled();
        },
        error: (err) => {
          fail(err);
        },
      });
    }));


    it('should not throws error and logs if well known issuer has a trailing slash compared to authwellknownUrl ', waitForAsync(() => {
      const trailingSlashIssuerWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer+"/"
      };

      spyOn(dataService, 'get').and.returnValue(of(trailingSlashIssuerWellKnown));

      const expected: AuthWellKnownEndpoints = {
        issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer+"/",
      };

      service
        .getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer
        })
        .subscribe((result) => {
          expect(result).toEqual(jasmine.objectContaining(expected));
        });
    }));

    it('should merge the mapped endpoints with the provided endpoints and ignore issuer/authwellknownUrl mismatch', waitForAsync(() => {
      const maliciousWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_MALICIOUS_URL
      };

      spyOn(dataService, 'get').and.returnValue(of(maliciousWellKnown));

      const expected: AuthWellKnownEndpoints = {
        endSessionEndpoint: 'config-endSessionEndpoint',
        revocationEndpoint: 'config-revocationEndpoint',
        jwksUri: DUMMY_WELL_KNOWN_DOCUMENT.jwks_uri,
        issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
      };

      service
        .getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
          authWellknownEndpoints: {
            endSessionEndpoint: 'config-endSessionEndpoint',
            revocationEndpoint: 'config-revocationEndpoint',
            issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer
          },
        })
        .subscribe((result) => {
          expect(result).toEqual(jasmine.objectContaining(expected));
        });
    }));
  });
});
