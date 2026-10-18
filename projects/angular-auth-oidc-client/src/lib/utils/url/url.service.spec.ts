import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/services/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { JwtWindowCryptoService } from '../../validation/jwt-window-crypto.service';
import { FlowHelper } from '../flowHelper/flow-helper.service';
import { UrlService } from './url.service';

describe('UrlService Tests', () => {
  let service: UrlService;
  let flowHelper: FlowHelper;
  let flowsDataService: FlowsDataService;
  let jwtWindowCryptoService: JwtWindowCryptoService;
  let storagePersistenceService: StoragePersistenceService;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UrlService,
        mockProvider(LoggerService),
        mockProvider(FlowsDataService),
        FlowHelper,
        mockProvider(StoragePersistenceService),
        mockProvider(JwtWindowCryptoService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(UrlService);
    loggerService = TestBed.inject(LoggerService);
    flowHelper = TestBed.inject(FlowHelper);
    flowsDataService = TestBed.inject(FlowsDataService);
    jwtWindowCryptoService = TestBed.inject(JwtWindowCryptoService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getUrlWithoutQueryParameters', () => {
    it('should return a new instance of the passed URL without any query parameters', () => {
      const url = new URL('https://any.url');
      const params = [
        { key: 'doot', value: 'boop' },
        { key: 'blep', value: 'blep' },
      ];

      params.forEach((p) => {
        url.searchParams.set(p.key, p.value);
      });

      const sut = service.getUrlWithoutQueryParameters(url);

      params.forEach((p) => {
        expect(sut.searchParams.has(p.key)).toBe(false);
      });
    });
  });

  describe('queryParametersExist', () => {
    const expected = new URLSearchParams();
    const params = [
      { key: 'doot', value: 'boop' },
      { key: 'blep', value: 'blep' },
    ];

    params.forEach((p) => {
      expected.set(p.key, p.value);
    });

    const matchingUrls = [
      new URL('https://any.url?doot=boop&blep=blep'),
      new URL('https://any.url?doot=boop&blep=blep&woop=doot'),
    ];
    const nonMatchingUrls = [
      new URL('https://any.url?doot=boop'),
      new URL('https://any.url?blep=blep&woop=doot'),
    ];

    matchingUrls.forEach((mu) => {
      it(`should return true for ${mu.toString()}`, () => {
        expect(service.queryParametersExist(expected, mu.searchParams)).toBe(
          true
        );
      });
    });

    nonMatchingUrls.forEach((nmu) => {
      it(`should return false for ${nmu.toString()}`, () => {
        expect(service.queryParametersExist(expected, nmu.searchParams)).toBe(
          false
        );
      });
    });
  });

  describe('isCallbackFromSts', () => {
    it(`should return false if config says to check redirect URI, and it doesn't match`, () => {
      const nonMatchingUrls = [
        {
          url: 'https://the-redirect.url?code=anycode',
          config: {
            redirectUrl: 'https://the-redirect.url?with=parameter',
            checkRedirectUrlWhenCheckingIfIsCallback: true,
          },
        },
        {
          url: 'https://the-redirect.url?wrong=parameter&code=anycode',
          config: {
            redirectUrl: 'https://the-redirect.url?with=parameter',
            checkRedirectUrlWhenCheckingIfIsCallback: true,
          },
        },
        {
          url: 'https://not-the-redirect.url?code=anycode',
          config: {
            redirectUrl: 'https://the-redirect.url',
            checkRedirectUrlWhenCheckingIfIsCallback: true,
          },
        },
      ];

      nonMatchingUrls.forEach((nmu) => {
        // sanity check: without the redirect check the url is a callback
        expect(service.isCallbackFromSts(nmu.url)).toBe(true);
        expect(service.isCallbackFromSts(nmu.url, nmu.config)).toBe(false);
      });
    });

    const testingValues = [
      { param: 'code', isCallbackFromSts: true },
      { param: 'state', isCallbackFromSts: true },
      { param: 'token', isCallbackFromSts: true },
      { param: 'id_token', isCallbackFromSts: true },
      { param: 'some_param', isCallbackFromSts: false },
    ];

    testingValues.forEach(({ param, isCallbackFromSts }) => {
      it(`should return ${isCallbackFromSts} when param is ${param}`, () => {
        const result = service.isCallbackFromSts(
          `https://any.url/?${param}=anyvalue`
        );

        expect(result).toBe(isCallbackFromSts);
      });
    });

    it('should return true for an implicit flow callback with the tokens in the fragment', () => {
      const result = service.isCallbackFromSts(
        'https://the-redirect.url/#id_token=anyvalue&access_token=anyvalue&state=anystate',
        {
          redirectUrl: 'https://the-redirect.url',
          checkRedirectUrlWhenCheckingIfIsCallback: true,
        }
      );

      expect(result).toBe(true);
    });

    it('should return false and log an error when the redirect check is enabled but no redirectUrl is configured', () => {
      // Arrange
      const config = {
        configId: 'configId1',
        checkRedirectUrlWhenCheckingIfIsCallback: true,
      };
      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      // Act
      const result = service.isCallbackFromSts(
        'https://the-redirect.url?code=anycode',
        config
      );

      // Assert
      expect(result).toBe(false);
      expect(logErrorSpy).toHaveBeenCalledWith(
        config,
        'UrlService.isCallbackFromSts: could not get redirectUrl from config, was: ',
        null
      );
    });
  });

  describe('getUrlParameter', () => {
    it('should return empty string when there is no urlToCheck', () => {
      const result = service.getUrlParameter('', 'code');

      expect(result).toBe('');
    });

    it('should return empty string when there is no name', () => {
      const result = service.getUrlParameter('url', '');

      expect(result).toBe('');
    });

    it('should return empty string when name is not a uri', () => {
      const result = service.getUrlParameter('url', 'anything');

      expect(result).toBe('');
    });

    it('should parse Url correctly with hash in the end', () => {
      const urlToCheck =
        'https://www.example.com/signin?code=thisisacode&state=0000.1234.000#';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisacode');
      expect(state).toBe('0000.1234.000');
    });

    it('should parse url with special chars in param and hash in the end', () => {
      const urlToCheck =
        'https://www.example.com/signin?code=thisisa$-_.+!*(),code&state=0000.1234.000#';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisa$-_.+!*(),code');
      expect(state).toBe('0000.1234.000');
    });

    it('should parse Url correctly with number&delimiter in params', () => {
      const urlToCheck =
        'https://www.example.com/signin?code=thisisacode&state=0000.1234.000';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisacode');
      expect(state).toBe('0000.1234.000');
    });

    it('should get correct param if params divided vith slash', () => {
      const urlToCheck =
        'https://www.example.com/signin?state=0000.1234.000&ui_locales=de&code=thisisacode#lang=de';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisacode');
      expect(state).toBe('0000.1234.000');
    });

    it('should get correct params when response_mode=fragment', () => {
      // Test url taken from an example in the RFC: https://datatracker.ietf.org/doc/html/rfc6749#section-4.2.2
      const urlToCheck =
        'http://example.com/cb#access_token=2YotnFZFEjr1zCsicMWpAA&state=xyz&token_type=example&expires_in=3600';
      const accessToken = service.getUrlParameter(urlToCheck, 'access_token');
      const state = service.getUrlParameter(urlToCheck, 'state');
      const tokenType = service.getUrlParameter(urlToCheck, 'token_type');
      const expiresIn = service.getUrlParameter(urlToCheck, 'expires_in');

      expect(accessToken).toBe('2YotnFZFEjr1zCsicMWpAA');
      expect(state).toBe('xyz');
      expect(tokenType).toBe('example');
      expect(expiresIn).toBe('3600');
    });

    it('should get correct params when square brackets are present', () => {
      const urlToCheck =
        'http://example.com/cb#state=abc[&code=abc&arr[]=1&some_param=abc]&arr[]=2&arr[]=3';
      const state = service.getUrlParameter(urlToCheck, 'state');
      const code = service.getUrlParameter(urlToCheck, 'code');
      const someParam = service.getUrlParameter(urlToCheck, 'some_param');
      const array = service.getUrlParameter(urlToCheck, 'arr[]');

      expect(state).toBe('abc[');
      expect(code).toBe('abc');
      expect(someParam).toBe('abc]');
      expect(['1', '2', '3']).toContain(array);
    });
  });

  describe('getAuthorizeUrl url composition', async () => {
    beforeEach(() => {
      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('state');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('nonce');
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        'codeVerifier'
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of('codeChallenge')
      );
    });

    it('should return empty string and log an error when the well-known endpoints have no authorizationEndpoint', async () => {
      const config = {
        configId: 'configId1',
        clientId: 'something',
        responseType: 'id_token token',
        scope: 'openid',
        redirectUrl: 'https://localhost:44386',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {};
          }

          return undefined;
        }
      );

      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      const value = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(value).toEqual('');
      expect(logErrorSpy).toHaveBeenCalledWith(
        config,
        `Can not create an authorize URL when authorizationEndpoint is 'undefined'`
      );
    });

    it('should return empty string when clientId is null', async () => {
      const config = {
        configId: 'configId1',
        clientId: '',
        redirectUrl: 'https://localhost:44386',
      };
      const authorizationEndpoint = 'authorizationEndpoint';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      const value = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(value).toEqual('');
      expect(logErrorSpy).toHaveBeenCalledWith(
        config,
        `createAuthorizeUrl could not add clientId because it was: `,
        ''
      );
    });

    it('should return empty string when responseType is null', async () => {
      const config = {
        configId: 'configId1',
        clientId: 'something',
        responseType: undefined,
        redirectUrl: 'https://localhost:44386',
      };
      const authorizationEndpoint = 'authorizationEndpoint';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      const value = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(value).toEqual('');
      expect(logErrorSpy).toHaveBeenCalledWith(
        config,
        `createAuthorizeUrl could not add responseType because it was: `,
        undefined
      );
    });

    it('should return empty string when scope is null', async () => {
      const config = {
        configId: 'configId1',
        clientId: 'something',
        responseType: 'responsetype',
        scope: undefined,
        redirectUrl: 'https://localhost:44386',
      };
      const authorizationEndpoint = 'authorizationEndpoint';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      const value = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(value).toEqual('');
      expect(logErrorSpy).toHaveBeenCalledWith(
        config,
        `createAuthorizeUrl could not add scope because it was: `,
        undefined
      );
    });

    it('should add code_challenge and code_challenge_method params to the authorize url for code flow', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'code';
      config.scope = 'openid email profile';
      config.redirectUrl = 'https://localhost:44386';
      config.customParamsAuthRequest = {
        testcustom: 'customvalue',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint: 'http://example' };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(service.getAuthorizeUrl(config));
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=code' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&code_challenge=codeChallenge&code_challenge_method=S256' +
        '&testcustom=customvalue';

      expect(value).toEqual(expectValue);
    });

    it('should add prompt=none to the silent renew url', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.silentRenewUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(config)
      );
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&prompt=none';

      expect(value).toEqual(expectValue);
    });

    it('should add prompt=none and custom values to the silent renew url', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.silentRenewUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(config, {
          to: 'add',
          as: 'well',
        })
      );
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&to=add&as=well' +
        '&prompt=none';

      expect(value).toEqual(expectValue);
    });

    it('should add the hd_param value to the authorize url', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.hdParam = 'myHdParam';
      config.configId = 'configId1';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(service.getAuthorizeUrl(config));
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&hd=myHdParam';

      expect(value).toEqual(expectValue);
    });

    it('should add a custom value to the authorize url', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      config.customParamsAuthRequest = {
        testcustom: 'customvalue',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(service.getAuthorizeUrl(config));
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&testcustom=customvalue';

      expect(value).toEqual(expectValue);
    });

    it('should add custom values to the authorize url', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      config.customParamsAuthRequest = {
        t4: 'ABC abc 123',
        t3: '#',
        t2: '-_.!~*()',
        t1: ';,/?:@&=+$',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(service.getAuthorizeUrl(config));
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state&t4=ABC%20abc%20123&t3=%23&t2=-_.!~*()&t1=%3B%2C%2F%3F%3A%40%26%3D%2B%24';

      expect(value).toEqual(expectValue);
    });

    it('should create an authorize url with custom values and dynamic custom values', async () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId:
          '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        configId: 'configId1',
        customParamsAuthRequest: {
          t4: 'ABC abc 123',
          t3: '#',
          t2: '-_.!~*()',
          t1: ';,/?:@&=+$',
        },
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(
        service.getAuthorizeUrl(config, {
          customParams: { to: 'add', as: 'well' },
        })
      );
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&t4=ABC%20abc%20123&t3=%23&t2=-_.!~*()&t1=%3B%2C%2F%3F%3A%40%26%3D%2B%24' +
        '&to=add&as=well';

      expect(value).toEqual(expectValue);
    });

    it('should create an authorize url with null custom values and dynamic custom values', async () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId:
          '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        customParamsAuthRequest: undefined,
        configId: 'configId1',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(
        service.getAuthorizeUrl(config, {
          customParams: { to: 'add', as: 'well' },
        })
      );
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&to=add&as=well';

      expect(value).toEqual(expectValue);
    });

    it('should create an authorize url without custom values but with dynamic custom values', async () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId:
          '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        configId: 'configId1',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(
        service.getAuthorizeUrl(config, {
          customParams: { to: 'add', as: 'well' },
        })
      );
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&to=add&as=well';

      expect(value).toEqual(expectValue);
    });

    // https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
    it('should create an authorize url for a custom url like active-directory-b2c', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId = 'myid';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint:
                'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(service.getAuthorizeUrl(config));
      const expectValue =
        'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in' +
        '&client_id=myid' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state';

      expect(value).toEqual(expectValue);
    });

    it('should create a default authorize url', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(service.getAuthorizeUrl(config));
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state';

      expect(value).toEqual(expectValue);
    });

    it('should add the prompt only once even if it is configured AND passed with `none` in silent renew case, taking the passed one', async () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'code';
      config.scope = 'openid email profile';
      config.silentRenewUrl = 'https://localhost:44386';

      config.customParamsAuthRequest = {
        prompt: 'select_account',
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint: 'http://example' };
          }

          return undefined;
        }
      );

      const value = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(config)
      );
      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=code' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&code_challenge=codeChallenge' +
        '&code_challenge_method=S256' +
        '&prompt=none';

      expect(value).toEqual(expectValue);
    });
  });

  describe('createRevocationEndpointBodyAccessToken', () => {
    it('should create a default access_token revocation body', () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example?cod=ddd';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              revocationEndpoint,
            };
          }

          return undefined;
        }
      );

      const value = service.createRevocationEndpointBodyAccessToken(
        'mytoken',
        config
      );
      const expectValue =
        'client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&token=mytoken&token_type_hint=access_token';

      expect(value).toEqual(expectValue);
    });

    it('should return null for the access_token revocation body when no clientId is given', () => {
      const config = {
        authority: 'https://localhost:5001',
        clientId: '',
      } as OpenIdConfiguration;
      const value = service.createRevocationEndpointBodyAccessToken(
        'mytoken',
        config
      );

      expect(value).toBeNull();
    });
  });

  describe('createRevocationEndpointBodyRefreshToken', () => {
    it('should create a default refresh_token revocation body', () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example?cod=ddd';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              revocationEndpoint,
            };
          }

          return undefined;
        }
      );

      const value = service.createRevocationEndpointBodyRefreshToken(
        'mytoken',
        config
      );
      const expectValue =
        'client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&token=mytoken&token_type_hint=refresh_token';

      expect(value).toEqual(expectValue);
    });

    it('should return null for the refresh_token revocation body when no clientId is given', () => {
      const config = {
        authority: 'https://localhost:5001',
        clientId: undefined,
      } as OpenIdConfiguration;
      const value = service.createRevocationEndpointBodyRefreshToken(
        'mytoken',
        config
      );

      expect(value).toBeNull();
    });
  });

  describe('getRevocationEndpointUrl', () => {
    it('should return the revocation endpoint url with params', () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example?cod=ddd';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              revocationEndpoint,
            };
          }

          return undefined;
        }
      );

      const value = service.getRevocationEndpointUrl(config);
      const expectValue = 'http://example';

      expect(value).toEqual(expectValue);
    });

    it('should return the default revocation endpoint url', () => {
      const config = {
        authority: 'https://localhost:5001',
      } as OpenIdConfiguration;

      config.redirectUrl = 'https://localhost:44386';
      config.clientId =
        '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              revocationEndpoint,
            };
          }

          return undefined;
        }
      );

      const value = service.getRevocationEndpointUrl(config);
      const expectValue = 'http://example';

      expect(value).toEqual(expectValue);
    });

    it('should return null for the revocation endpoint url when no revocation endpoint is given', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              revocationEndpoint: null,
            };
          }

          return undefined;
        }
      );
      const value = service.getRevocationEndpointUrl({});

      expect(value).toBeNull();
    });

    it('should return null for the revocation endpoint url when no well-known endpoints are given', () => {
      const value = service.getRevocationEndpointUrl({});

      expect(value).toBeNull();
    });
  });

  describe('getAuthorizeUrl redirect url', () => {
    const config = {
      configId: 'configId1',
      redirectUrl: 'one-url',
      clientId: 'clientId',
      responseType: 'id_token token',
      scope: 'openid',
    };

    beforeEach(() => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint: 'http://example' };
          }

          return undefined;
        }
      );
    });

    it('should use the configured redirectUrl', async () => {
      const url = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(url).toContain('redirect_uri=one-url&');
    });

    it('should use the redirectUrl redefined in AuthOptions', async () => {
      const url = await firstValueFrom(
        service.getAuthorizeUrl(config, { redirectUrl: 'other-url' })
      );

      expect(url).toContain('redirect_uri=other-url&');
    });
  });

  describe('getAuthorizeUrl', () => {
    it('should return null if no config is given', async () => {
      const url = await firstValueFrom(service.getAuthorizeUrl(null));

      expect(url).toBeNull();
    });

    it('should return null if current flow is code flow and no redirect url is defined', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);

      const result = await firstValueFrom(
        service.getAuthorizeUrl({ configId: 'configId1' })
      );

      expect(result).toBeNull();
    });

    it('should return empty string if current flow is code flow, config disabled pkce and there is a redirecturl', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const config = {
        configId: 'configId1',
        disablePkce: true,
        redirectUrl: 'some-redirectUrl',
      } as OpenIdConfiguration;
      const result = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(result).toBe('');
    });

    it('should return url if current flow is code flow, pkce enabled, there is a redirecturl and awkep are given', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const config = {
        configId: 'configId1',
        disablePkce: false,
        redirectUrl: 'some-redirectUrl',
        clientId: 'some-clientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: undefined,
        customParamsAuthRequest: undefined,
      } as OpenIdConfiguration;
      const authorizationEndpoint = 'authorizationEndpoint';

      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of('some-code-challenge')
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      const result = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(result).toBe(
        'authorizationEndpoint?client_id=some-clientId&redirect_uri=some-redirectUrl&response_type=testResponseType&scope=testScope&nonce=undefined&state=undefined&code_challenge=some-code-challenge&code_challenge_method=S256'
      );
    });

    it('should create an implicit flow url without code challenge if current flow is NOT code flow', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint: 'authorizationEndpoint' };
          }

          return undefined;
        }
      );
      const generateCodeChallengeSpy = vi.spyOn(
        jwtWindowCryptoService,
        'generateCodeChallenge'
      );

      const result = await firstValueFrom(
        service.getAuthorizeUrl({
          configId: 'configId1',
          redirectUrl: 'some-redirectUrl',
          clientId: 'some-clientId',
          responseType: 'id_token token',
          scope: 'testScope',
        })
      );

      expect(generateCodeChallengeSpy).not.toHaveBeenCalled();
      expect(result).toBe(
        'authorizationEndpoint?client_id=some-clientId&redirect_uri=some-redirectUrl&response_type=id_token%20token&scope=testScope&nonce=undefined&state=undefined'
      );
    });

    it('should return empty string if flow is not code flow and no redirect url is defined', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);
      const resultObs$ = service.getAuthorizeUrl({ configId: 'configId1' });
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe('');
    });
  });

  describe('getRefreshSessionSilentRenewUrl', () => {
    const silentRenewConfig = {
      configId: 'configId1',
      silentRenewUrl: 'http://any-url.com',
      clientId: 'clientId',
      responseType: 'responseType',
      scope: 'testScope',
    };

    beforeEach(() => {
      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('testState');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('testNonce');
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint: 'authorizationEndpoint' };
          }

          return undefined;
        }
      );
    });

    it('should create a silent renew url with code challenge if current flow is code flow', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const createCodeVerifierSpy = vi
        .spyOn(flowsDataService, 'createCodeVerifier')
        .mockReturnValue('codeVerifier');
      const generateCodeChallengeSpy = vi
        .spyOn(jwtWindowCryptoService, 'generateCodeChallenge')
        .mockReturnValue(of('codeChallenge'));

      const result = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(silentRenewConfig)
      );

      expect(createCodeVerifierSpy).toHaveBeenCalledWith(silentRenewConfig);
      expect(generateCodeChallengeSpy).toHaveBeenCalledWith('codeVerifier');
      expect(result).toBe(
        'authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com&response_type=responseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=codeChallenge&code_challenge_method=S256&prompt=none'
      );
    });

    it('should create a silent renew url without code challenge if current flow is NOT code flow', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);
      const generateCodeChallengeSpy = vi.spyOn(
        jwtWindowCryptoService,
        'generateCodeChallenge'
      );

      const result = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(silentRenewConfig)
      );

      expect(generateCodeChallengeSpy).not.toHaveBeenCalled();
      expect(result).toBe(
        'authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com&response_type=responseType&scope=testScope&nonce=testNonce&state=testState&prompt=none'
      );
    });
  });

  describe('createBodyForCodeFlowCodeRequest', () => {
    it('should return null if no code verifier is set', () => {
      vi.spyOn(flowsDataService, 'getCodeVerifier').mockReturnValue(null);
      const result = service.createBodyForCodeFlowCodeRequest(
        'notRelevantParam',
        { configId: 'configId1', clientId: 'clientId' }
      );

      expect(result).toBeNull();
    });

    it('should return null if no clientId is set', () => {
      const codeVerifier = 'codeverifier';

      vi.spyOn(flowsDataService, 'getCodeVerifier').mockReturnValue(
        codeVerifier
      );
      const clientId = '';
      const result = service.createBodyForCodeFlowCodeRequest(
        'notRelevantParam',
        { clientId }
      );

      expect(result).toBeNull();
    });

    it('should return null if silentrenewRunning is false and redirectUrl is falsy', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const redirectUrl = '';
      const clientId = 'clientId';

      vi.spyOn(flowsDataService, 'getCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);

      const result = service.createBodyForCodeFlowCodeRequest(code, {
        clientId,
        redirectUrl,
      });

      expect(result).toBeNull();
    });

    it('should return correctUrl with silentrenewRunning is false', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const redirectUrl = 'redirectUrl';
      const clientId = 'clientId';

      vi.spyOn(flowsDataService, 'getCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);

      const result = service.createBodyForCodeFlowCodeRequest(code, {
        clientId,
        redirectUrl,
      });
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&redirect_uri=${redirectUrl}`;

      expect(result).toBe(expected);
    });

    it('should return correctUrl with silentrenewRunning is true', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const silentRenewUrl = 'silentRenewUrl';
      const clientId = 'clientId';

      vi.spyOn(flowsDataService, 'getCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);

      const result = service.createBodyForCodeFlowCodeRequest(code, {
        clientId,
        silentRenewUrl,
      });
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&redirect_uri=${silentRenewUrl}`;

      expect(result).toBe(expected);
    });

    it('should return correctUrl when customTokenParams are provided', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const silentRenewUrl = 'silentRenewUrl';
      const clientId = 'clientId';
      const customTokenParams = { foo: 'bar' };

      vi.spyOn(flowsDataService, 'getCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);

      const result = service.createBodyForCodeFlowCodeRequest(
        code,
        { clientId, silentRenewUrl },
        customTokenParams
      );
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&foo=bar&redirect_uri=${silentRenewUrl}`;

      expect(result).toBe(expected);
    });

    it('should return null if pkce is enabled and no code verifier is given', () => {
      const code = 'code';
      const customTokenParams = { foo: 'bar' };
      const config = {
        clientId: 'clientId',
        disablePkce: false,
      };

      vi.spyOn(flowsDataService, 'getCodeVerifier').mockReturnValue(null);

      const loggerspy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const result = service.createBodyForCodeFlowCodeRequest(
        code,
        config,
        customTokenParams
      );

      expect(result).toBe(null);
      expect(loggerspy).toHaveBeenCalledTimes(1);
      expect(loggerspy).toHaveBeenCalledWith(
        config,
        'CodeVerifier is not set ',
        null
      );
    });

    it('should omit code_verifier and not read it when disablePkce is true', () => {
      // Arrange
      const code = 'code';
      const redirectUrl = 'redirectUrl';
      const clientId = 'clientId';
      const getCodeVerifierSpy = vi.spyOn(flowsDataService, 'getCodeVerifier');

      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);

      // Act
      const result = service.createBodyForCodeFlowCodeRequest(code, {
        clientId,
        redirectUrl,
        disablePkce: true,
      });

      // Assert
      expect(result).toBe(
        `grant_type=authorization_code&client_id=${clientId}&code=${code}&redirect_uri=${redirectUrl}`
      );
      expect(getCodeVerifierSpy).not.toHaveBeenCalled();
    });
  });

  describe('createBodyForCodeFlowRefreshTokensRequest', () => {
    it('should return correct URL', () => {
      const clientId = 'clientId';
      const refreshToken = 'refreshToken';
      const result = service.createBodyForCodeFlowRefreshTokensRequest(
        refreshToken,
        { clientId }
      );

      expect(result).toBe(
        `grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}`
      );
    });

    it('should return correct URL with custom params if custom params are passed', () => {
      const clientId = 'clientId';
      const refreshToken = 'refreshToken';
      const result = service.createBodyForCodeFlowRefreshTokensRequest(
        refreshToken,
        { clientId },
        { any: 'thing' }
      );

      expect(result).toBe(
        `grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}&any=thing`
      );
    });

    it('should return null if clientId is falsy', () => {
      const clientId = '';
      const refreshToken = 'refreshToken';
      const result = service.createBodyForCodeFlowRefreshTokensRequest(
        refreshToken,
        { clientId }
      );

      expect(result).toBe(null);
    });
  });

  describe('createBodyForParCodeFlowRequest', () => {
    it('should return null redirectUrl is falsy', async () => {
      const resultObs$ = service.createBodyForParCodeFlowRequest({
        redirectUrl: '',
      });
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(null);
    });

    it('should return basic URL with no extras if properties are given', async () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: undefined,
        customParamsAuthRequest: undefined,
        redirectUrl: 'testRedirectUrl',
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('testState');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('testNonce');
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        'testCodeVerifier'
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of('testCodeChallenge')
      );

      const resultObs$ = service.createBodyForParCodeFlowRequest(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256`
      );
    });

    it('should return basic URL with hdParam if properties are given', async () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParamsAuthRequest: undefined,
        redirectUrl: 'testRedirectUrl',
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('testState');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('testNonce');
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        'testCodeVerifier'
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of('testCodeChallenge')
      );

      const resultObs$ = service.createBodyForParCodeFlowRequest(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam`
      );
    });

    it('should return basic URL with hdParam and custom params if properties are given', async () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParamsAuthRequest: { any: 'thing' },
        redirectUrl: 'testRedirectUrl',
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('testState');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('testNonce');
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        'testCodeVerifier'
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of('testCodeChallenge')
      );

      const resultObs$ = service.createBodyForParCodeFlowRequest(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam&any=thing`
      );
    });

    it('should return basic URL with hdParam and custom params and passed cutom params if properties are given', async () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParamsAuthRequest: { any: 'thing' },
        redirectUrl: 'testRedirectUrl',
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('testState');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('testNonce');
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        'testCodeVerifier'
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of('testCodeChallenge')
      );

      const resultObs$ = service.createBodyForParCodeFlowRequest(config, {
        customParams: {
          any: 'otherThing',
        },
      });
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam&any=otherThing`
      );
    });

    it('should omit code_challenge and code_challenge_method when disablePkce is true', async () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: undefined,
        customParamsAuthRequest: undefined,
        redirectUrl: 'testRedirectUrl',
        disablePkce: true,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('testState');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('testNonce');
      const createCodeVerifierSpy = vi
        .spyOn(flowsDataService, 'createCodeVerifier')
        .mockReturnValue('testCodeVerifier');
      const generateCodeChallengeSpy = vi
        .spyOn(jwtWindowCryptoService, 'generateCodeChallenge')
        .mockReturnValue(of('testCodeChallenge'));
      const resultObs$ = service.createBodyForParCodeFlowRequest(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState`
      );
      expect(result).not.toContain('code_challenge');
      expect(result).not.toContain('code_challenge_method');
      expect(createCodeVerifierSpy).not.toHaveBeenCalled();
      expect(generateCodeChallengeSpy).not.toHaveBeenCalled();
    });

    it('should use empty values for client_id, response_type and scope when they are not configured', async () => {
      // Arrange
      const config = {
        redirectUrl: 'testRedirectUrl',
        disablePkce: true,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue('testState');
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue('testNonce');

      // Act
      const result = await firstValueFrom(
        service.createBodyForParCodeFlowRequest(config)
      );

      // Assert
      expect(result).toBe(
        `client_id=&redirect_uri=testRedirectUrl&response_type=&scope=&nonce=testNonce&state=testState`
      );
    });
  });

  describe('getRefreshSessionSilentRenewUrl for implicit flow', () => {
    it('should return null if silentrenewUrl is falsy', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = undefined;

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);

      const config = {
        silentRenewUrl,
      };
      const result = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(config)
      );

      expect(result).toBeNull();
    });

    it('should return correct URL if wellknownendpoints are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const scope = 'testScope';
      const config = {
        silentRenewUrl,
        clientId,
        responseType,
        scope,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint,
            };
          }

          return undefined;
        }
      );

      const result = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(config)
      );

      expect(result).toBe(
        `authorizationEndpoint?client_id=${clientId}&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&prompt=none`
      );
    });

    it('should return null if wellknownendpoints are not given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const config = {
        silentRenewUrl,
        clientId,
        responseType,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );

      const result = await firstValueFrom(
        service.getRefreshSessionSilentRenewUrl(config)
      );

      expect(result).toBe(null);
    });
  });

  describe('getRefreshSessionSilentRenewUrl for code flow', () => {
    it('should return empty string if silentrenewUrl is falsy', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = undefined;
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge';

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of(codeChallenge)
      );

      const config = {
        silentRenewUrl,
      };
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const resultObs$ = service.getRefreshSessionSilentRenewUrl(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe('');
    });

    it('should return correct URL if wellknownendpoints are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge';
      const scope = 'testScope';
      const config = {
        silentRenewUrl,
        clientId,
        responseType,
        scope,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of(codeChallenge)
      );

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const resultObs$ = service.getRefreshSessionSilentRenewUrl(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `authorizationEndpoint?client_id=${clientId}&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256&prompt=none`
      );
    });

    it('should return empty string if no wellknownendpoints are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge';
      const config = {
        silentRenewUrl,
        clientId,
        responseType,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of(codeChallenge)
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );

      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const resultObs$ = service.getRefreshSessionSilentRenewUrl(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe('');
    });
  });

  describe('getAuthorizeUrl for implicit flow', () => {
    it('should return correct URL if wellknownendpoints are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const scope = 'testScope';
      const config = {
        redirectUrl,
        clientId,
        responseType,
        scope,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      const result = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(result).toBe(
        `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}`
      );
    });

    it('should return empty string and log an error if no wellknownendpoints are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const config = { redirectUrl, clientId, responseType };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );

      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      const result = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(result).toBe('');
      expect(logErrorSpy).toHaveBeenCalledWith(
        config,
        'authWellKnownEndpoints is undefined'
      );
    });

    it('should return empty string and log an error if there is no redirecturl', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = '';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const config = { redirectUrl, clientId, responseType };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );

      const logErrorSpy = vi.spyOn(loggerService, 'logError');
      const result = await firstValueFrom(service.getAuthorizeUrl(config));

      expect(result).toBe('');
      expect(logErrorSpy).toHaveBeenCalledWith(
        config,
        `could not get redirectUrl, was: `,
        ''
      );
    });
  });

  describe('getAuthorizeUrl for code flow', () => {
    it('should return correct URL if wellknownendpoints are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const scope = 'testScope';
      const redirectUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge';
      const config = {
        redirectUrl,
        clientId,
        responseType,
        scope,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of(codeChallenge)
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const resultObs$ = service.getAuthorizeUrl(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}` +
          `&code_challenge=${codeChallenge}&code_challenge_method=S256`
      );
    });

    it('should return correct URL if wellknownendpoints and custom params are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const scope = 'testScope';
      const redirectUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge';
      const configId = 'configId1';
      const config = {
        redirectUrl,
        clientId,
        responseType,
        scope,
        configId,
      };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of(codeChallenge)
      );

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { authorizationEndpoint };
          }

          return undefined;
        }
      );

      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const resultObs$ = service.getAuthorizeUrl(config, {
        customParams: { to: 'add', as: 'well' },
      });
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe(
        `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com` +
          `&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}` +
          `&code_challenge=${codeChallenge}&code_challenge_method=S256&to=add&as=well`
      );
    });

    it('should return empty string if no wellknownendpoints are given', async () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge';
      const config = { redirectUrl, clientId, responseType };

      vi.spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).mockReturnValue(state);
      vi.spyOn(flowsDataService, 'createNonce').mockReturnValue(nonce);
      vi.spyOn(flowsDataService, 'createCodeVerifier').mockReturnValue(
        codeVerifier
      );
      vi.spyOn(jwtWindowCryptoService, 'generateCodeChallenge').mockReturnValue(
        of(codeChallenge)
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );

      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const resultObs$ = service.getAuthorizeUrl(config);
      const result = await firstValueFrom(resultObs$);

      expect(result).toBe('');
    });
  });

  describe('getEndSessionUrl', () => {
    it('should return null if no config given', () => {
      const value = service.getEndSessionUrl(null);

      expect(value).toBeNull();
    });

    it('should create URL when all parameters given', () => {
      //Arrange
      const config = {
        postLogoutRedirectUri: 'https://localhost:44386/Unauthorized',
      } as OpenIdConfiguration;

      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'mytoken'
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              endSessionEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      // Act
      const value = service.getEndSessionUrl(config);
      // Assert
      const expectValue =
        'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

      expect(value).toEqual(expectValue);
    });

    it('should create URL when all parameters given but no idTokenHint', () => {
      // Arrange
      const config = {
        postLogoutRedirectUri: 'https://localhost:44386/Unauthorized',
      } as OpenIdConfiguration;

      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue('');
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              endSessionEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      // Act
      const value = service.getEndSessionUrl(config);
      // Assert
      const expectValue =
        'http://example?post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

      expect(value).toEqual(expectValue);
    });

    it('should create URL when all parameters and customParamsEndSession given', () => {
      // Arrange
      const config = {
        postLogoutRedirectUri: 'https://localhost:44386/Unauthorized',
      } as OpenIdConfiguration;

      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'mytoken'
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              endSessionEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );

      // Act
      const value = service.getEndSessionUrl(config, { param: 'to-add' });
      // Assert
      const expectValue =
        'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized&param=to-add';

      expect(value).toEqual(expectValue);
    });

    it('should create an authorize url with an azure-ad-b2c policy parameter', () => {
      // Arrange
      const config = {
        postLogoutRedirectUri: 'https://localhost:44386/Unauthorized',
      } as OpenIdConfiguration;
      const endSessionEndpoint =
        'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in';

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              endSessionEndpoint,
            };
          }

          return undefined;
        }
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'UzI1NiIsImtpZCI6Il'
      );

      // Act
      const value = service.getEndSessionUrl(config);
      // Assert
      const expectValue =
        'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in' +
        '&id_token_hint=UzI1NiIsImtpZCI6Il' +
        '&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

      expect(value).toEqual(expectValue);
    });

    it('should create URL without postLogoutRedirectUri when not given', () => {
      const config = {
        postLogoutRedirectUri: '',
      } as OpenIdConfiguration;

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              endSessionEndpoint: 'http://example',
            };
          }

          return undefined;
        }
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'mytoken'
      );

      // Act
      const value = service.getEndSessionUrl(config);
      // Assert
      const expectValue = 'http://example?id_token_hint=mytoken';

      expect(value).toEqual(expectValue);
    });

    it('should return null if no wellknownEndpoints.endSessionEndpoint given', () => {
      // Arrange
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              endSessionEndpoint: null,
            };
          }

          return undefined;
        }
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'mytoken'
      );

      // Act
      const value = service.getEndSessionUrl({});

      // Assert
      expect(value).toEqual(null);
    });

    it('should return auth0 format URL if authority ends with .auth0', () => {
      // Arrange
      const config = {
        authority: 'something.auth0.com',
        clientId: 'someClientId',
        postLogoutRedirectUri: 'https://localhost:1234/unauthorized',
      };
      // Act
      const value = service.getEndSessionUrl(config);
      // Assert
      const expectValue = `something.auth0.com/v2/logout?client_id=someClientId&returnTo=https%3A%2F%2Flocalhost%3A1234%2Funauthorized`;

      expect(value).toEqual(expectValue);
    });

    it('should return auth0 format URL without returnTo if no postLogoutRedirectUri is configured', () => {
      // Arrange
      const config = {
        authority: 'something.auth0.com',
        clientId: 'someClientId',
      };
      // Act
      const value = service.getEndSessionUrl(config);

      // Assert
      expect(value).toEqual(
        'something.auth0.com/v2/logout?client_id=someClientId'
      );
    });

    it('should return auth0 format URL for a custom domain when useCustomAuth0Domain is true', () => {
      // Arrange
      const config = {
        authority: 'https://login.my-company.com',
        clientId: 'someClientId',
        useCustomAuth0Domain: true,
      };
      // Act
      const value = service.getEndSessionUrl(config);

      // Assert
      expect(value).toEqual(
        'https://login.my-company.com/v2/logout?client_id=someClientId'
      );
    });

    it('should return auth0 format URL with an empty client_id when no clientId is configured', () => {
      // Arrange
      const config = {
        authority: 'something.auth0.com',
      };
      // Act
      const value = service.getEndSessionUrl(config);

      // Assert
      expect(value).toEqual('something.auth0.com/v2/logout?client_id=');
    });
  });

  describe('getAuthorizeParUrl', () => {
    it('should return null if authWellKnownEndPoints is undefined', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );

      const result = service.getAuthorizeParUrl('', { configId: 'configId1' });

      expect(result).toBe(null);
    });

    it('should return null if authWellKnownEndPoints-authorizationEndpoint is undefined', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              notAuthorizationEndpoint: 'anything',
            };
          }

          return undefined;
        }
      );

      const result = service.getAuthorizeParUrl('', { configId: 'configId1' });

      expect(result).toBe(null);
    });

    it('should return null if configurationProvider.openIDConfiguration has no clientId', () => {
      const config = { clientId: '' } as OpenIdConfiguration;

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'anything',
            };
          }

          return undefined;
        }
      );

      const result = service.getAuthorizeParUrl('', config);

      expect(result).toBe(null);
    });

    it('should return correct URL when everything is given', () => {
      const config = { clientId: 'clientId' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              authorizationEndpoint: 'anything',
            };
          }

          return undefined;
        }
      );

      const result = service.getAuthorizeParUrl('passedRequestUri', config);

      expect(result).toBe(
        'anything?request_uri=passedRequestUri&client_id=clientId'
      );
    });
  });
});
