import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
import { FlowsDataService } from '../../flows/flows-data.service';
import { FlowsDataServiceMock } from '../../flows/flows-data.service-mock';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../../storage/storage-persistence.service-mock';
import { JwtWindowCryptoService } from '../../validation/jwt-window-crypto.service';
import { JwtWindowCryptoServiceMock } from '../../validation/jwt-window-crypto.service-mock';
import { FlowHelper } from '../flowHelper/flow-helper.service';
import { OpenIdConfiguration } from './../../config/openid-configuration';
import { UrlService } from './url.service';

describe('UrlService Tests', () => {
  let service: UrlService;
  let flowHelper: FlowHelper;
  let flowsDataService: FlowsDataService;
  let jwtWindowCryptoService: JwtWindowCryptoService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UrlService,
        {
          provide: LoggerService,
          useClass: mockClass(LoggerService),
        },
        {
          provide: FlowsDataService,
          useClass: FlowsDataServiceMock,
        },
        FlowHelper,
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
        { provide: JwtWindowCryptoService, useClass: JwtWindowCryptoServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(UrlService);
    flowHelper = TestBed.inject(FlowHelper);
    flowsDataService = TestBed.inject(FlowsDataService);
    jwtWindowCryptoService = TestBed.inject(JwtWindowCryptoService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('isCallbackFromSts', () => {
    const testingValues = [
      { param: 'code', isCallbackFromSts: true },
      { param: 'state', isCallbackFromSts: true },
      { param: 'token', isCallbackFromSts: true },
      { param: 'id_token', isCallbackFromSts: true },
      { param: 'some_param', isCallbackFromSts: false },
    ];

    testingValues.forEach(({ param, isCallbackFromSts }) => {
      it(`should return ${isCallbackFromSts} when param is ${param}`, () => {
        const result = service.isCallbackFromSts(`https://any.url/?${param}=anyvalue`);
        expect(result).toBe(isCallbackFromSts);
      });
    });
  });

  describe('getUrlParameter', () => {
    it('returns empty string when there is no urlToCheck', () => {
      const result = service.getUrlParameter('', 'code');

      expect(result).toBe('');
    });

    it('returns empty string when there is no name', () => {
      const result = service.getUrlParameter('url', '');

      expect(result).toBe('');
    });

    it('returns empty string when name is not a uri', () => {
      const result = service.getUrlParameter('url', 'anything');

      expect(result).toBe('');
    });

    it('parses Url correctly with hash in the end', () => {
      const urlToCheck = 'https://www.example.com/signin?code=thisisacode&state=0000.1234.000#';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisacode');
      expect(state).toBe('0000.1234.000');
    });

    it('parses url with special chars in param and hash in the end', () => {
      const urlToCheck = 'https://www.example.com/signin?code=thisisa$-_.+!*(),code&state=0000.1234.000#';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisa$-_.+!*(),code');
      expect(state).toBe('0000.1234.000');
    });

    it('parses Url correctly with number&delimiter in params', () => {
      const urlToCheck = 'https://www.example.com/signin?code=thisisacode&state=0000.1234.000';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisacode');
      expect(state).toBe('0000.1234.000');
    });

    it('gets correct param if params divided vith slash', () => {
      const urlToCheck = 'https://www.example.com/signin?state=0000.1234.000&ui_locales=de&code=thisisacode#lang=de';
      const code = service.getUrlParameter(urlToCheck, 'code');
      const state = service.getUrlParameter(urlToCheck, 'state');

      expect(code).toBe('thisisacode');
      expect(state).toBe('0000.1234.000');
    });
  });

  describe('createAuthorizeUrl', () => {
    it('returns null when no authoizationendpoint given -> wellKnownEndpoints null', () => {
      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        'https://localhost:44386',
        'nonce',
        'state'
      );

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('returns null when no authoizationendpoint given -> configurationProvider null', () => {
      (service as any).configurationProvider = null;

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        'https://localhost:44386',
        'nonce',
        'state'
      );

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('returns null when clientId is null', () => {
      const config = { configId: 'configId1', clientId: null };
      const authorizationEndpoint = 'authorizationEndpoint';
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ authorizationEndpoint });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        'https://localhost:44386',
        'nonce',
        'state',
        config
      );

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('returns null when responseType is null', () => {
      const config = { configId: 'configId1', clientId: 'something', responseType: null };
      const authorizationEndpoint = 'authorizationEndpoint';
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ authorizationEndpoint });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        'https://localhost:44386',
        'nonce',
        'state',
        config
      );

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('returns null when scope is null', () => {
      const config = { configId: 'configId1', clientId: 'something', responseType: 'responsetype', scope: null };
      const authorizationEndpoint = 'authorizationEndpoint';
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ authorizationEndpoint });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        'https://localhost:44386',
        'nonce',
        'state',
        config
      );

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with code flow adds "code_challenge" and "code_challenge_method" param', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'code';
      config.scope = 'openid email profile';
      config.redirectUrl = 'https://localhost:44386';
      config.customParamsAuthRequest = {
        testcustom: 'customvalue',
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config
      );

      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=code' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&code_challenge=&code_challenge_method=S256' +
        '&testcustom=customvalue';

      expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with prompt adds prompt value', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config,
        'myprompt'
      );

      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&prompt=myprompt';

      expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with prompt and custom values adds prompt value and custom values', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config,
        'myprompt',
        { to: 'add', as: 'well' }
      );

      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&to=add&as=well' +
        '&prompt=myprompt';

      expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with hdParam adds hdparam value', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.hdParam = 'myHdParam';
      config.configId = 'configId1';

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config
      );

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

    it('createAuthorizeUrl with custom value', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      config.customParamsAuthRequest = {
        testcustom: 'customvalue',
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config
      );

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

    it('createAuthorizeUrl with custom values', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      config.customParamsAuthRequest = {
        t4: 'ABC abc 123',
        t3: '#',
        t2: '-_.!~*()',
        t1: ';,/?:@&=+$',
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config
      );

      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state&t4=ABC%20abc%20123&t3=%23&t2=-_.!~*()&t1=%3B%2C%2F%3F%3A%40%26%3D%2B%24';

      expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl creates URL with with custom values and dynamic custom values', () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
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

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config,
        null,
        { to: 'add', as: 'well' }
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

    it('createAuthorizeUrl creates URL with custom values equals null and dynamic custom values', () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        customParamsAuthRequest: null,
        configId: 'configId1',
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config,
        null,
        { to: 'add', as: 'well' }
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

    it('createAuthorizeUrl creates URL with custom values not given and dynamic custom values', () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        configId: 'configId1',
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config,
        null,
        { to: 'add', as: 'well' }
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
    it('createAuthorizeUrl with custom URL like active-directory-b2c', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = 'myid';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config
      );

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

    it('createAuthorizeUrl default', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId1';

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'http://example',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config
      );

      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=id_token%20token' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state';

      expect(value).toEqual(expectValue);
    });

    it('should add the prompt only once even if it is configured AND passed with `none` in silent renew case, taking the passed one', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'code';
      config.scope = 'openid email profile';
      config.redirectUrl = 'https://localhost:44386';

      config.customParamsAuthRequest = {
        prompt: 'select_account',
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config,
        'somePrompt'
      );

      const expectValue =
        'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
        '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
        '&response_type=code' +
        '&scope=openid%20email%20profile' +
        '&nonce=nonce' +
        '&state=state' +
        '&code_challenge=' +
        '&code_challenge_method=S256' +
        '&prompt=somePrompt';

      expect(value).toEqual(expectValue);
    });
  });

  describe('createRevocationEndpointBodyAccessToken', () => {
    it('createRevocationBody access_token default', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example?cod=ddd';
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        revocationEndpoint,
      });

      const value = service.createRevocationEndpointBodyAccessToken('mytoken', config);
      const expectValue =
        'client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&token=mytoken&token_type_hint=access_token';

      expect(value).toEqual(expectValue);
    });

    it('createRevocationEndpointBodyAccessToken returns null when no clientId is given', () => {
      const config = { authority: 'https://localhost:5001', clientId: null } as OpenIdConfiguration;
      const value = service.createRevocationEndpointBodyAccessToken('mytoken', config);

      expect(value).toBeNull();
    });
  });

  describe('createRevocationEndpointBodyRefreshToken', () => {
    it('createRevocationBody refresh_token default', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example?cod=ddd';
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        revocationEndpoint,
      });

      const value = service.createRevocationEndpointBodyRefreshToken('mytoken', config);
      const expectValue =
        'client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&token=mytoken&token_type_hint=refresh_token';

      expect(value).toEqual(expectValue);
    });

    it('createRevocationEndpointBodyRefreshToken returns null when no clientId is given', () => {
      const config = { authority: 'https://localhost:5001', clientId: null } as OpenIdConfiguration;
      const value = service.createRevocationEndpointBodyRefreshToken('mytoken', config);

      expect(value).toBeNull();
    });
  });

  describe('getRevocationEndpointUrl', () => {
    it('getRevocationEndpointUrl with params', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example?cod=ddd';
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        revocationEndpoint,
      });

      const value = service.getRevocationEndpointUrl(config);

      const expectValue = 'http://example';

      expect(value).toEqual(expectValue);
    });

    it('getRevocationEndpointUrl default', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const revocationEndpoint = 'http://example';
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        revocationEndpoint,
      });

      const value = service.getRevocationEndpointUrl(config);

      const expectValue = 'http://example';

      expect(value).toEqual(expectValue);
    });

    it('getRevocationEndpointUrl returns null when there is not revociationendpoint given', () => {
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', null).and.returnValue({
        revocationEndpoint: null,
      });
      const value = service.getRevocationEndpointUrl(null);

      expect(value).toBeNull();
    });

    it('getRevocationEndpointUrl returns null when there is no wellKnownEndpoints given', () => {
      const value = service.getRevocationEndpointUrl(null);

      expect(value).toBeNull();
    });
  });

  describe('getAuthorizeUrl', () => {
    it('calls createUrlCodeFlowAuthorize if current flow is code flow', () => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      const spy = spyOn(service as any, 'createUrlCodeFlowAuthorize');
      service.getAuthorizeUrl({ configId: 'configId1' });
      expect(spy).toHaveBeenCalled();
    });

    it('calls createUrlImplicitFlowAuthorize if current flow is NOT code flow', () => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
      const spyCreateUrlCodeFlowAuthorize = spyOn(service as any, 'createUrlCodeFlowAuthorize');
      const spyCreateUrlImplicitFlowAuthorize = spyOn(service as any, 'createUrlImplicitFlowAuthorize');
      service.getAuthorizeUrl({ configId: 'configId1' });
      expect(spyCreateUrlCodeFlowAuthorize).not.toHaveBeenCalled();
      expect(spyCreateUrlImplicitFlowAuthorize).toHaveBeenCalled();
    });

    it('return empty string if flow is not code flow and createUrlImplicitFlowAuthorize returns falsy', () => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
      const spy = spyOn(service as any, 'createUrlImplicitFlowAuthorize').and.returnValue('');
      const resultObs$ = service.getAuthorizeUrl({ configId: 'configId1' });
      resultObs$.subscribe((result) => {
        expect(spy).toHaveBeenCalled();
        expect(result).toBe('');
      });
    });
  });

  describe('getRefreshSessionSilentRenewUrl', () => {
    it('calls createUrlCodeFlowWithSilentRenew if current flow is code flow', () => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      const spy = spyOn(service as any, 'createUrlCodeFlowWithSilentRenew');
      service.getRefreshSessionSilentRenewUrl({ configId: 'configId1' });
      expect(spy).toHaveBeenCalled();
    });

    it('calls createUrlImplicitFlowWithSilentRenew if current flow is NOT code flow', () => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
      const spyCreateUrlCodeFlowWithSilentRenew = spyOn(service as any, 'createUrlCodeFlowWithSilentRenew');
      const spyCreateUrlImplicitFlowWithSilentRenew = spyOn(service as any, 'createUrlImplicitFlowWithSilentRenew');
      service.getRefreshSessionSilentRenewUrl({ configId: 'configId1' });
      expect(spyCreateUrlCodeFlowWithSilentRenew).not.toHaveBeenCalled();
      expect(spyCreateUrlImplicitFlowWithSilentRenew).toHaveBeenCalled();
    });

    it('return empty string if flow is not code flow and createUrlImplicitFlowWithSilentRenew returns falsy', () => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
      const spy = spyOn(service as any, 'createUrlImplicitFlowWithSilentRenew').and.returnValue('');
      const resultObs$ = service.getRefreshSessionSilentRenewUrl({ configId: 'configId1' });
      resultObs$.subscribe((result) => {
        expect(spy).toHaveBeenCalled();
        expect(result).toBe('');
      });
    });
  });

  describe('createBodyForCodeFlowCodeRequest', () => {
    it('returns null if no code verifier is set', () => {
      spyOn(flowsDataService, 'getCodeVerifier').and.returnValue(null);
      const result = service.createBodyForCodeFlowCodeRequest('notRelevantParam', { configId: 'configId1' });
      expect(result).toBeNull();
    });

    it('returns null if no clientId is set', () => {
      const codeVerifier = 'codeverifier';
      spyOn(flowsDataService, 'getCodeVerifier').and.returnValue(codeVerifier);
      const clientId = null;
      const result = service.createBodyForCodeFlowCodeRequest('notRelevantParam', { clientId });
      expect(result).toBeNull();
    });

    it('returns null if silentrenewRunning is false and redirectUrl is falsy', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const redirectUrl = null;
      const clientId = 'clientId';
      spyOn(flowsDataService, 'getCodeVerifier').and.returnValue(codeVerifier);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);

      const result = service.createBodyForCodeFlowCodeRequest(code, { clientId, redirectUrl });

      expect(result).toBeNull();
    });

    it('returns correctUrl with silentrenewRunning is false', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const redirectUrl = 'redirectUrl';
      const clientId = 'clientId';
      spyOn(flowsDataService, 'getCodeVerifier').and.returnValue(codeVerifier);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);

      const result = service.createBodyForCodeFlowCodeRequest(code, { clientId, redirectUrl });
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&redirect_uri=${redirectUrl}`;

      expect(result).toBe(expected);
    });

    it('returns correctUrl with silentrenewRunning is true', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const silentRenewUrl = 'silentRenewUrl';
      const clientId = 'clientId';
      spyOn(flowsDataService, 'getCodeVerifier').and.returnValue(codeVerifier);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

      const result = service.createBodyForCodeFlowCodeRequest(code, { clientId, silentRenewUrl });
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&redirect_uri=${silentRenewUrl}`;

      expect(result).toBe(expected);
    });

    it('returns correctUrl when customTokenParams are provided', () => {
      const codeVerifier = 'codeverifier';
      const code = 'code';
      const silentRenewUrl = 'silentRenewUrl';
      const clientId = 'clientId';
      const customTokenParams = { foo: 'bar' };
      spyOn(flowsDataService, 'getCodeVerifier').and.returnValue(codeVerifier);
      spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

      const result = service.createBodyForCodeFlowCodeRequest(code, { clientId, silentRenewUrl }, customTokenParams);
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&foo=bar&redirect_uri=${silentRenewUrl}`;

      expect(result).toBe(expected);
    });
  });

  describe('createBodyForCodeFlowRefreshTokensRequest', () => {
    it('returns correct URL', () => {
      const clientId = 'clientId';
      const refreshToken = 'refreshToken';
      const result = service.createBodyForCodeFlowRefreshTokensRequest(refreshToken, { clientId });
      expect(result).toBe(`grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}`);
    });

    it('returns correct URL with custom params if custom params are passed', () => {
      const clientId = 'clientId';
      const refreshToken = 'refreshToken';
      const result = service.createBodyForCodeFlowRefreshTokensRequest(refreshToken, { clientId }, { any: 'thing' });
      expect(result).toBe(`grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}&any=thing`);
    });

    it('returns null if clientId is falsy', () => {
      const clientId = '';
      const refreshToken = 'refreshToken';
      const result = service.createBodyForCodeFlowRefreshTokensRequest(refreshToken, { clientId });
      expect(result).toBe(null);
    });
  });

  describe('createBodyForParCodeFlowRequest', () => {
    it('returns null redirectUrl is falsy', () => {
      const resultObs$ = service.createBodyForParCodeFlowRequest({ redirectUrl: '' });
      resultObs$.subscribe((result) => {
        expect(result).toBe(null);
      });
    });

    it('returns basic URL with no extras if properties are given', () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: null,
        customParamsAuthRequest: null,
        redirectUrl: 'testRedirectUrl',
      };
      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('testState');
      spyOn(flowsDataService, 'createNonce').and.returnValue('testNonce');
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue('testCodeVerifier');
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of('testCodeChallenge'));

      const resultObs$ = service.createBodyForParCodeFlowRequest(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe(
          `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256`
        );
      });
    });

    it('returns basic URL with hdParam if properties are given', () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParamsAuthRequest: null,
        redirectUrl: 'testRedirectUrl',
      };
      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('testState');
      spyOn(flowsDataService, 'createNonce').and.returnValue('testNonce');
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue('testCodeVerifier');
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of('testCodeChallenge'));

      const resultObs$ = service.createBodyForParCodeFlowRequest(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe(
          `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam`
        );
      });
    });

    it('returns basic URL with hdParam and custom params if properties are given', () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParamsAuthRequest: { any: 'thing' },
        redirectUrl: 'testRedirectUrl',
      };
      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('testState');
      spyOn(flowsDataService, 'createNonce').and.returnValue('testNonce');
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue('testCodeVerifier');
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of('testCodeChallenge'));

      const resultObs$ = service.createBodyForParCodeFlowRequest(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe(
          `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam&any=thing`
        );
      });
    });

    it('returns basic URL with hdParam and custom params and passed cutom params if properties are given', () => {
      const config = {
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParamsAuthRequest: { any: 'thing' },
        redirectUrl: 'testRedirectUrl',
      };
      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('testState');
      spyOn(flowsDataService, 'createNonce').and.returnValue('testNonce');
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue('testCodeVerifier');
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of('testCodeChallenge'));

      const resultObs$ = service.createBodyForParCodeFlowRequest(config, { any: 'otherThing' });
      resultObs$.subscribe((result) => {
        expect(result).toBe(
          `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam&any=thing&any=otherThing`
        );
      });
    });
  });

  describe('createUrlImplicitFlowWithSilentRenew', () => {
    it('returns null if silentrenewUrl is falsy', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = null;

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);

      const config = {
        silentRenewUrl,
      };

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowWithSilentRenew(config);
      expect(result).toBeNull();
    });

    it('returns correct URL if wellknownendpoints are given', () => {
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

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowWithSilentRenew(config);
      expect(result).toBe(
        `authorizationEndpoint?client_id=${clientId}&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&prompt=none`
      );
    });

    it('returns correct url if wellknownendpoints are not given', () => {
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

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue(null);

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowWithSilentRenew(config);
      expect(result).toBe(null);
    });
  });

  describe('createUrlCodeFlowWithSilentRenew', () => {
    it('returns empty string if silentrenewUrl is falsy', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = null;
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue(codeVerifier);
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of(codeChallenge));

      const config = {
        silentRenewUrl,
      };

      const serviceAsAny = service as any;

      const resultObs$ = serviceAsAny.createUrlCodeFlowWithSilentRenew(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe('');
      });
    });

    it('returns correct URL if wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';
      const scope = 'testScope';
      const config = {
        silentRenewUrl,
        clientId,
        responseType,
        scope,
      };

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue(codeVerifier);
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of(codeChallenge));

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ authorizationEndpoint });

      const serviceAsAny = service as any;

      const resultObs$ = serviceAsAny.createUrlCodeFlowWithSilentRenew(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe(
          `authorizationEndpoint?client_id=${clientId}&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&prompt=none`
        );
      });
    });

    it('returns empty string if no wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';
      const config = {
        silentRenewUrl,
        clientId,
        responseType,
      };

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue(codeVerifier);
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of(codeChallenge));
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue(null);

      const serviceAsAny = service as any;

      const resultObs$ = serviceAsAny.createUrlCodeFlowWithSilentRenew(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe(null);
      });
    });
  });

  describe('createUrlImplicitFlowAuthorize', () => {
    it('returns correct URL if wellknownendpoints are given', () => {
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

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ authorizationEndpoint });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowAuthorize(config);
      expect(result).toBe(
        `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}`
      );
    });

    it('returns empty string if no wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const config = { redirectUrl, clientId, responseType };

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue(null);

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowAuthorize(config);
      expect(result).toBe(null);
    });

    it('returns null if there is nor redirecturl', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = '';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const config = { redirectUrl, clientId, responseType };

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue(null);

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowAuthorize(config);
      expect(result).toBe(null);
    });
  });

  describe('createUrlCodeFlowAuthorize', () => {
    it('returns null if redirectUrl is falsy', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = null;
      const config = {
        redirectUrl,
      };

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);

      const serviceAsAny = service as any;

      const resultObs$ = serviceAsAny.createUrlCodeFlowAuthorize(config);
      resultObs$.subscribe((result) => {
        expect(result).toBeNull();
      });
    });

    it('returns correct URL if wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const scope = 'testScope';
      const redirectUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';
      const config = {
        redirectUrl,
        clientId,
        responseType,
        scope,
      };

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue(codeVerifier);
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of(codeChallenge));
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ authorizationEndpoint });

      const serviceAsAny = service as any;

      const resultObs$ = serviceAsAny.createUrlCodeFlowAuthorize(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe(
          `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}`
        );
      });
    });

    it('returns correct URL if wellknownendpoints and custom params are given', () => {
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

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue(codeVerifier);
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of(codeChallenge));

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({ authorizationEndpoint });

      const serviceAsAny = service as any;

      const resultObs$ = serviceAsAny.createUrlCodeFlowAuthorize(config, { to: 'add', as: 'well' });
      resultObs$.subscribe((result) => {
        expect(result).toBe(
          `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com` +
            `&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&to=add&as=well`
        );
      });
    });

    it('returns empty string if no wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';
      const config = { redirectUrl, clientId, responseType };

      spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue(state);
      spyOn(flowsDataService, 'createNonce').and.returnValue(nonce);
      spyOn(flowsDataService, 'createCodeVerifier').and.returnValue(codeVerifier);
      spyOn(jwtWindowCryptoService, 'generateCodeChallenge').and.returnValue(of(codeChallenge));
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue(null);

      const serviceAsAny = service as any;

      const resultObs$ = serviceAsAny.createUrlCodeFlowAuthorize(config);
      resultObs$.subscribe((result) => {
        expect(result).toBe('');
      });
    });
  });

  describe('createEndSessionUrl', () => {
    it('create URL when all parameters given', () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        postLogoutRedirectUri: 'https://localhost:44386/Unauthorized',
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        endSessionEndpoint: 'http://example',
      });

      const value = service.createEndSessionUrl('mytoken', config);

      const expectValue = 'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

      expect(value).toEqual(expectValue);
    });

    it('create URL when all parameters and customParamsEndSession given', () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        postLogoutRedirectUri: 'https://localhost:44386/Unauthorized',
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        endSessionEndpoint: 'http://example',
      });

      const value = service.createEndSessionUrl('mytoken', config, { param: 'to-add' });

      const expectValue =
        'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized&param=to-add';

      expect(value).toEqual(expectValue);
    });

    it('with azure-ad-b2c policy parameter', () => {
      const config = { authority: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = 'myid';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';

      const endSessionEndpoint = 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in';

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        endSessionEndpoint,
      });
      const value = service.createEndSessionUrl('UzI1NiIsImtpZCI6Il', config);

      const expectValue =
        'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in' +
        '&id_token_hint=UzI1NiIsImtpZCI6Il' +
        '&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

      expect(value).toEqual(expectValue);
    });

    it('create URL without postLogoutRedirectUri when not given', () => {
      const config = {
        authority: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        postLogoutRedirectUri: null,
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        endSessionEndpoint: 'http://example',
      });

      const value = service.createEndSessionUrl('mytoken', config);

      const expectValue = 'http://example?id_token_hint=mytoken';

      expect(value).toEqual(expectValue);
    });

    it('returns null if no wellknownEndpoints given', () => {
      const value = service.createEndSessionUrl('mytoken', {});

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('returns null if no wellknownEndpoints.endSessionEndpoint given', () => {
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', {}).and.returnValue({
        endSessionEndpoint: null,
      });

      const value = service.createEndSessionUrl('mytoken', {});

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('returns auth0 format URL if authority ends with .auth0', () => {
      const config = {
        authority: 'something.auth0.com',
        clientId: 'someClientId',
        postLogoutRedirectUri: 'https://localhost:1234/unauthorized',
      };

      const value = service.createEndSessionUrl('anything', config);

      const expectValue = `something.auth0.com/v2/logout?client_id=someClientId&returnTo=https://localhost:1234/unauthorized`;

      expect(value).toEqual(expectValue);
    });
  });

  describe('getAuthorizeParUrl', () => {
    it('returns null if authWellKnownEndPoints is undefined', () => {
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', { configId: 'configId1' }).and.returnValue(null);

      const result = service.getAuthorizeParUrl('', { configId: 'configId1' });

      expect(result).toBe(null);
    });

    it('returns null if authWellKnownEndPoints-authorizationEndpoint is undefined', () => {
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', { configId: 'configId1' }).and.returnValue({
        notAuthorizationEndpoint: 'anything',
      });

      const result = service.getAuthorizeParUrl('', { configId: 'configId1' });

      expect(result).toBe(null);
    });

    it('returns null if configurationProvider.openIDConfiguration has no clientId', () => {
      const config = { clientId: null };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'anything',
      });

      const result = service.getAuthorizeParUrl('', config);

      expect(result).toBe(null);
    });

    it('returns correct URL when everything is given', () => {
      const config = { clientId: 'clientId' };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', config).and.returnValue({
        authorizationEndpoint: 'anything',
      });

      const result = service.getAuthorizeParUrl('passedRequestUri', config);

      expect(result).toBe('anything?request_uri=passedRequestUri&client_id=clientId');
    });
  });
});
