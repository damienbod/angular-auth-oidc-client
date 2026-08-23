import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
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
    it('should add suffix if it does not exist on current URL', async () => {
      const dataServiceSpy = vi
        .spyOn(dataService, 'get')
        .mockReturnValue(of(null));
      const urlWithoutSuffix = 'myUrl';
      const urlWithSuffix = `${urlWithoutSuffix}/.well-known/openid-configuration`;

      await firstValueFrom(
        (service as any).getWellKnownDocument(urlWithoutSuffix, {
          configId: 'configId1',
        })
      );

      expect(dataServiceSpy).toHaveBeenCalledTimes(1);
      expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix, {
        configId: 'configId1',
      });
    });

    it('should not add suffix if it does exist on current url', async () => {
      const dataServiceSpy = vi
        .spyOn(dataService, 'get')
        .mockReturnValue(of(null));
      const urlWithSuffix = `myUrl/.well-known/openid-configuration`;

      await firstValueFrom(
        (service as any).getWellKnownDocument(urlWithSuffix, {
          configId: 'configId1',
        })
      );

      expect(dataServiceSpy).toHaveBeenCalledTimes(1);
      expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix, {
        configId: 'configId1',
      });
    });

    it('should not add suffix if it does exist in the middle of current url', async () => {
      const dataServiceSpy = vi
        .spyOn(dataService, 'get')
        .mockReturnValue(of(null));
      const urlWithSuffix = `myUrl/.well-known/openid-configuration/and/some/more/stuff`;

      await firstValueFrom(
        (service as any).getWellKnownDocument(urlWithSuffix, {
          configId: 'configId1',
        })
      );

      expect(dataServiceSpy).toHaveBeenCalledTimes(1);
      expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix, {
        configId: 'configId1',
      });
    });

    it('should use the custom suffix provided in the config', async () => {
      const dataServiceSpy = vi
        .spyOn(dataService, 'get')
        .mockReturnValue(of(null));
      const urlWithoutSuffix = `myUrl`;
      const urlWithSuffix = `${urlWithoutSuffix}/.well-known/test-openid-configuration`;

      await firstValueFrom(
        (service as any).getWellKnownDocument(urlWithoutSuffix, {
          configId: 'configId1',
          authWellknownUrlSuffix: '/.well-known/test-openid-configuration',
        })
      );

      expect(dataServiceSpy).toHaveBeenCalledTimes(1);
      expect(dataServiceSpy).toHaveBeenCalledWith(urlWithSuffix, {
        configId: 'configId1',
        authWellknownUrlSuffix: '/.well-known/test-openid-configuration',
      });
    });

    it('should retry once', async () => {
      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('one')),
          of(DUMMY_WELL_KNOWN_DOCUMENT)
        )
      );

      const res = await firstValueFrom(
        (service as any).getWellKnownDocument('anyurl', {
          configId: 'configId1',
        })
      );

      expect(res).toBeTruthy();
      expect(res).toEqual(DUMMY_WELL_KNOWN_DOCUMENT);
    });

    it('should retry twice', async () => {
      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('one')),
          throwError(() => new Error('two')),
          of(DUMMY_WELL_KNOWN_DOCUMENT)
        )
      );

      const res = await firstValueFrom(
        (service as any).getWellKnownDocument('anyurl', {
          configId: 'configId1',
        })
      );

      expect(res).toBeTruthy();
      expect(res).toEqual(DUMMY_WELL_KNOWN_DOCUMENT);
    });

    it('should fail after three tries', async () => {
      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('one')),
          throwError(() => new Error('two')),
          throwError(() => new Error('three')),
          of(DUMMY_WELL_KNOWN_DOCUMENT)
        )
      );

      await expect(
        firstValueFrom(
          (service as any).getWellKnownDocument('anyurl', 'configId')
        )
      ).rejects.toBeTruthy();
    });
  });

  describe('getWellKnownEndPointsForConfig', () => {
    it('calling internal getWellKnownDocument and maps', async () => {
      vi.spyOn(dataService, 'get').mockReturnValue(
        of({
          issuer: 'localhost',
          jwks_uri: 'jwks_uri',
        })
      );

      const spy = vi.spyOn(service as any, 'getWellKnownDocument');
      const result = await firstValueFrom(
        service.getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: 'localhost',
        })
      );

      expect(spy).toHaveBeenCalled();
      expect((result as any).jwks_uri).toBeUndefined();
      expect(result.jwksUri).toBe('jwks_uri');
      expect(result.issuer).toBe('localhost');
    });

    it('throws error and logs if no authwellknownUrl is given', async () => {
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const config = {
        configId: 'configId1',
        authWellknownEndpointUrl: undefined,
      };

      try {
        await firstValueFrom(service.getWellKnownEndPointsForConfig(config));
        expect.fail('expected an error');
      } catch (error: any) {
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          config,
          'no authWellknownEndpoint given!'
        );
        expect(error.message).toEqual('no authWellknownEndpoint given!');
      }
    });

    it('should merge the mapped endpoints with the provided endpoints', async () => {
      vi.spyOn(dataService, 'get').mockReturnValue(
        of(DUMMY_WELL_KNOWN_DOCUMENT)
      );

      const expected: AuthWellKnownEndpoints = {
        endSessionEndpoint: 'config-endSessionEndpoint',
        revocationEndpoint: 'config-revocationEndpoint',
        jwksUri: DUMMY_WELL_KNOWN_DOCUMENT.jwks_uri,
      };
      const result = await firstValueFrom(
        service.getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
          authWellknownEndpoints: {
            endSessionEndpoint: 'config-endSessionEndpoint',
            revocationEndpoint: 'config-revocationEndpoint',
          },
        })
      );

      expect(result).toEqual(expect.objectContaining(expected));
    });

    it('throws error and logs if well known issuer does not match authwellknownUrl', async () => {
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const maliciousWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_MALICIOUS_URL,
      };

      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(of(maliciousWellKnown))
      );

      const config = {
        configId: 'configId1',
        authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
      };

      try {
        const result = await firstValueFrom(
          service.getWellKnownEndPointsForConfig(config)
        );

        expect.fail(
          `Retrieval was supposed to fail. Well known endpoints returned : ${JSON.stringify(
            result
          )}`
        );
      } catch (error: any) {
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
          config,
          `Issuer mismatch. Well known issuer ${DUMMY_MALICIOUS_URL} does not match configured well known url ${DUMMY_WELL_KNOWN_DOCUMENT.issuer}`
        );
        expect(error.message).toEqual(
          `Issuer mismatch. Well known issuer ${DUMMY_MALICIOUS_URL} does not match configured well known url ${DUMMY_WELL_KNOWN_DOCUMENT.issuer}`
        );
      }
    });

    it('throws no error if well known issuer does not match authwellknownUrl and validation is disabled', async () => {
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const maliciousWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_MALICIOUS_URL,
      };

      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(of(maliciousWellKnown))
      );

      const config = {
        configId: 'configId1',
        authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
        strictIssuerValidationOnWellKnownRetrievalOff: true,
      };
      const result = await firstValueFrom(
        service.getWellKnownEndPointsForConfig(config)
      );

      expect(result.issuer).toBe(DUMMY_MALICIOUS_URL);
      expect(loggerSpy).not.toHaveBeenCalled();
    });

    it('should not throws error and logs if well known issuer has a trailing slash compared to authwellknownUrl ', async () => {
      const trailingSlashIssuerWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer + '/',
      };

      vi.spyOn(dataService, 'get').mockReturnValue(
        of(trailingSlashIssuerWellKnown)
      );

      const expected: AuthWellKnownEndpoints = {
        issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer + '/',
      };
      const result = await firstValueFrom(
        service.getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
        })
      );

      expect(result).toEqual(expect.objectContaining(expected));
    });

    it('should merge the mapped endpoints with the provided endpoints and ignore issuer/authwellknownUrl mismatch', async () => {
      const maliciousWellKnown = {
        ...DUMMY_WELL_KNOWN_DOCUMENT,
        issuer: DUMMY_MALICIOUS_URL,
      };

      vi.spyOn(dataService, 'get').mockReturnValue(of(maliciousWellKnown));

      const expected: AuthWellKnownEndpoints = {
        endSessionEndpoint: 'config-endSessionEndpoint',
        revocationEndpoint: 'config-revocationEndpoint',
        jwksUri: DUMMY_WELL_KNOWN_DOCUMENT.jwks_uri,
        issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
      };
      const result = await firstValueFrom(
        service.getWellKnownEndPointsForConfig({
          configId: 'configId1',
          authWellknownEndpointUrl: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
          authWellknownEndpoints: {
            endSessionEndpoint: 'config-endSessionEndpoint',
            revocationEndpoint: 'config-revocationEndpoint',
            issuer: DUMMY_WELL_KNOWN_DOCUMENT.issuer,
          },
        })
      );

      expect(result).toEqual(expect.objectContaining(expected));
    });
  });
});
