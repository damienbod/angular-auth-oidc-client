import { DOCUMENT } from '@angular/common';
import { createServiceFactory, SpectatorService, SpyObject } from '@ngneat/spectator';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { JsrsAsignReducedService } from '../../validation/jsrsasign-reduced.service';
import { FlowHelper } from '../flowHelper/flow-helper.service';
import { UrlService } from './url.service';

describe('UrlService Tests', () => {
  let spec: SpectatorService<UrlService>;
  let service: UrlService;

  let configurationProvider: SpyObject<ConfigurationProvider>;
  let flowHelper: SpyObject<FlowHelper>;
  let flowsDataService: SpyObject<FlowsDataService>;
  let storagePersistenceService: SpyObject<StoragePersistenceService>;
  let jsrsAsignReducedService: SpyObject<JsrsAsignReducedService>;
  let mywindow: any;

  const createService = createServiceFactory({
    service: UrlService,
    mocks: [ConfigurationProvider, LoggerService, FlowsDataService, FlowHelper, JsrsAsignReducedService, StoragePersistenceService],
  });

  beforeEach(() => {
    spec = createService();
    service = spec.service;

    service = spec.inject(UrlService);
    configurationProvider = spec.inject(ConfigurationProvider);
    flowHelper = spec.inject(FlowHelper);
    flowsDataService = spec.inject(FlowsDataService);
    storagePersistenceService = spec.inject(StoragePersistenceService);
    jsrsAsignReducedService = spec.inject(JsrsAsignReducedService);

    mywindow = spec.inject(DOCUMENT).defaultView;
  });

  it('should create', () => {
    expect(service).toBeTruthy();
    expect(mywindow).toBeTruthy();
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
      configurationProvider.getOpenIDConfiguration.and.returnValue(null);

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
      const clientId = null;
      const authorizationEndpoint = 'authorizationEndpoint';
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId });
      storagePersistenceService.read.withArgs('authWellKnownEndPoints').and.returnValue({ authorizationEndpoint });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        'https://localhost:44386',
        'nonce',
        'state'
      );

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('returns null when responseType is null', () => {
      const clientId = 'something';
      const responseType = null;
      const authorizationEndpoint = 'authorizationEndpoint';
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId, responseType });
      storagePersistenceService.read.withArgs('authWellKnownEndPoints').and.returnValue({ authorizationEndpoint });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        'https://localhost:44386',
        'nonce',
        'state'
      );

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    // it('returns null when responseType is null', () => {
    //   const clientId = 'something';
    //   const responseType = 'responsetype';
    //   const scope = null;
    //   const authorizationEndpoint = 'authorizationEndpoint';
    //   configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId, responseType, scope });
    //   storagePersistenceService.read.withArgs('authWellKnownEndPoints').and.returnValue({ authorizationEndpoint });

    //   const value = (service as any).createAuthorizeUrl(
    //     '', // Implicit Flow
    //     'https://localhost:44386',
    //     'nonce',
    //     'state'
    //   );

    //   const expectValue = null;

    //   expect(value).toEqual(expectValue);
    // });

    it('createAuthorizeUrl with code flow adds "code_challenge" and "code_challenge_method" param', () => {
      const config = {
        stsServer: 'https://localhost:5001',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'code',
        scope: 'openid email profile',
        redirectUrl: 'https://localhost:44386',
        customParams: {
          testcustom: 'customvalue',
        },
        configId: 'configId',
      } as OpenIdConfiguration;

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      flowHelper.isCurrentFlowCodeFlow.and.returnValue(true);

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId
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
      const config = {
        stsServer: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        configId: 'configId',
      } as OpenIdConfiguration;

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId,
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
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId';

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId,
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
        '&prompt=myprompt' +
        '&to=add&as=well';

      expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with hdParam adds hdparam value', () => {
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.hdParam = 'myHdParam';
      config.configId = 'configId';

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId
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
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId';

      config.customParams = {
        testcustom: 'customvalue',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId
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
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId';
      config.customParams = {
        t4: 'ABC abc 123',
        t3: '#',
        t2: '-_.!~*()',
        t1: ';,/?:@&=+$',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId
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

    it('createAuthorizeUrl creates url with with custom values and dynamic custom values', () => {
      const config = {
        stsServer: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        customParams: {
          t4: 'ABC abc 123',
          t3: '#',
          t2: '-_.!~*()',
          t1: ';,/?:@&=+$',
        },
        configId: 'configId',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId,
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

    it('createAuthorizeUrl creates url with custom values equals null and dynamic custom values', () => {
      const config = {
        stsServer: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        customParams: null,
        configId: 'configId',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId,
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

    it('createAuthorizeUrl creates url with custom values not given and dynamic custom values', () => {
      const config = {
        stsServer: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        configId: 'configId',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId,
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
    it('createAuthorizeUrl with custom url like active-directory-b2c', () => {
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = 'myid';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId';

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', config.configId).and.returnValue({
        authorizationEndpoint: 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in',
      });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId
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
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.configId = 'configId';

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read
        .withArgs('authWellKnownEndPoints', config.configId)
        .and.returnValue({ authorizationEndpoint: 'http://example' });

      const value = (service as any).createAuthorizeUrl(
        '', // Implicit Flow
        config.redirectUrl,
        'nonce',
        'state',
        config.configId
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
  });

  describe('createEndSessionUrl', () => {
    it('createEndSessionUrl with azure-ad-b2c policy parameter', () => {
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = 'myid';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
      config.configId = 'configId';

      const endSessionEndpoint = 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in';
      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', config.configId).and.returnValue({ endSessionEndpoint });
      const value = service.createEndSessionUrl('UzI1NiIsImtpZCI6Il', config.configId);

      const expectValue =
        'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in' +
        '&id_token_hint=UzI1NiIsImtpZCI6Il' +
        '&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

      expect(value).toEqual(expectValue);
    });
  });

  describe('createRevocationEndpointBodyAccessToken', () => {
    it('createRevocationBody access_token default', () => {
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
      config.configId = 'configId';

      const revocationEndpoint = 'http://example?cod=ddd';
      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', config.configId).and.returnValue({ revocationEndpoint });

      const value = service.createRevocationEndpointBodyAccessToken('mytoken', config.configId);
      const expectValue =
        'client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&token=mytoken&token_type_hint=access_token';

      expect(value).toEqual(expectValue);
    });

    it('createRevocationEndpointBodyAccessToken returns null when no clientId is given', () => {
      const config = { stsServer: 'https://localhost:5001', clientId: null, configId: 'configId' } as OpenIdConfiguration;

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);

      const value = service.createRevocationEndpointBodyAccessToken('mytoken', config.configId);

      expect(value).toBeNull();
    });
  });

  describe('createRevocationEndpointBodyRefreshToken', () => {
    it('createRevocationBody refresh_token default', () => {
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
      config.configId = 'configId';

      const revocationEndpoint = 'http://example?cod=ddd';
      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', config.configId).and.returnValue({ revocationEndpoint });

      const value = service.createRevocationEndpointBodyRefreshToken('mytoken', config.configId);
      const expectValue =
        'client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&token=mytoken&token_type_hint=refresh_token';
      expect(value).toEqual(expectValue);
    });

    it('createRevocationEndpointBodyRefreshToken returns null when no clientId is given', () => {
      const config = { stsServer: 'https://localhost:5001', clientId: null, configId: 'configId' } as OpenIdConfiguration;
      configurationProvider.getOpenIDConfiguration.and.returnValue(config);

      const value = service.createRevocationEndpointBodyRefreshToken('mytoken', config.configId);

      expect(value).toBeNull();
    });
  });

  describe('getRevocationEndpointUrl', () => {
    it('getRevocationEndpointUrl with params', () => {
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
      config.configId = 'configId';
      const revocationEndpoint = 'http://example?cod=ddd';

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', config.configId).and.returnValue({ revocationEndpoint });

      const value = service.getRevocationEndpointUrl(config.configId);
      const expectValue = 'http://example';

      expect(value).toEqual(expectValue);
    });

    it('getRevocationEndpointUrl default', () => {
      const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
      config.redirectUrl = 'https://localhost:44386';
      config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
      config.responseType = 'id_token token';
      config.scope = 'openid email profile';
      config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
      const revocationEndpoint = 'http://example';

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', config.configId).and.returnValue({ revocationEndpoint });

      const value = service.getRevocationEndpointUrl(config.configId);
      const expectValue = 'http://example';

      expect(value).toEqual(expectValue);
    });

    it('getRevocationEndpointUrl returns null when there is not revociationendpoint given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue(null);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ revocationEndpoint: null });
      const value = service.getRevocationEndpointUrl('configId');
      expect(value).toBeNull();
    });

    it('getRevocationEndpointUrl returns null when there is no wellKnownEndpoints given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue(null);
      const value = service.getRevocationEndpointUrl('configId');
      expect(value).toBeNull();
    });
  });

  describe('getAuthorizeUrl', () => {
    it('calls createUrlCodeFlowAuthorize if current flow is code flow', () => {
      flowHelper.isCurrentFlowCodeFlow.and.returnValue(true);
      const spy = spyOn(service as any, 'createUrlCodeFlowAuthorize');

      service.getAuthorizeUrl('configId');

      expect(spy).toHaveBeenCalled();
    });

    it('calls createUrlImplicitFlowAuthorize if current flow is NOT code flow', () => {
      flowHelper.isCurrentFlowCodeFlow.and.returnValue(false);

      const spyCreateUrlCodeFlowAuthorize = spyOn(service as any, 'createUrlCodeFlowAuthorize');
      const spyCreateUrlImplicitFlowAuthorize = spyOn(service as any, 'createUrlImplicitFlowAuthorize');

      service.getAuthorizeUrl('configId');

      expect(spyCreateUrlCodeFlowAuthorize).not.toHaveBeenCalled();
      expect(spyCreateUrlImplicitFlowAuthorize).toHaveBeenCalled();
    });

    it('return empty string if flow is not code flow and createUrlImplicitFlowAuthorize returns falsy', () => {
      flowHelper.isCurrentFlowCodeFlow.and.returnValue(false);

      const spy = spyOn(service as any, 'createUrlImplicitFlowAuthorize').and.returnValue('');

      const result = service.getAuthorizeUrl('configId');
      expect(spy).toHaveBeenCalled();
      expect(result).toBe('');
    });
  });

  describe('getRefreshSessionSilentRenewUrl', () => {
    it('calls createUrlCodeFlowWithSilentRenew if current flow is code flow', () => {
      flowHelper.isCurrentFlowCodeFlow.and.returnValue(true);
      const spy = spyOn(service as any, 'createUrlCodeFlowWithSilentRenew');

      service.getRefreshSessionSilentRenewUrl('configId');

      expect(spy).toHaveBeenCalled();
    });

    it('calls createUrlImplicitFlowWithSilentRenew if current flow is NOT code flow', () => {
      flowHelper.isCurrentFlowCodeFlow.and.returnValue(false);

      const spyCreateUrlCodeFlowWithSilentRenew = spyOn(service as any, 'createUrlCodeFlowWithSilentRenew');
      const spyCreateUrlImplicitFlowWithSilentRenew = spyOn(service as any, 'createUrlImplicitFlowWithSilentRenew');

      service.getRefreshSessionSilentRenewUrl('configId');

      expect(spyCreateUrlCodeFlowWithSilentRenew).not.toHaveBeenCalled();
      expect(spyCreateUrlImplicitFlowWithSilentRenew).toHaveBeenCalled();
    });

    it('return empty string if flow is not code flow and createUrlImplicitFlowWithSilentRenew returns falsy', () => {
      flowHelper.isCurrentFlowCodeFlow.and.returnValue(false);
      const spy = spyOn(service as any, 'createUrlImplicitFlowWithSilentRenew').and.returnValue('');

      const result = service.getRefreshSessionSilentRenewUrl('configId');

      expect(spy).toHaveBeenCalled();
      expect(result).toBe('');
    });
  });

  describe('createBodyForCodeFlowCodeRequest', () => {
    it('returns null if no code verifier is set', () => {
      flowsDataService.getCodeVerifier.and.returnValue(null);

      const result = service.createBodyForCodeFlowCodeRequest('notRelevantParam', 'configId');

      expect(result).toBeNull();
    });

    it('returns null if no clientId is set', () => {
      const codeVerifier = 'this_is_a_codeverifier';
      flowsDataService.getCodeVerifier.and.returnValue(codeVerifier);
      const clientId = null;

      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId });

      const result = service.createBodyForCodeFlowCodeRequest('notRelevantParam', 'configId');
      expect(result).toBeNull();
    });

    it('returns null if silentrenewRunning is false and redirectUrl is falsy', () => {
      const codeVerifier = 'this_is_a_codeverifier';
      const code = 'this_is_a_code';
      const redirectUrl = null;
      const clientId = 'clientId';
      flowsDataService.getCodeVerifier.and.returnValue(codeVerifier);
      flowsDataService.isSilentRenewRunning.and.returnValue(false);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId, redirectUrl });

      const result = service.createBodyForCodeFlowCodeRequest(code, 'configId');

      expect(result).toBeNull();
    });

    it('returns correctUrl with silentRenewRunning is false', () => {
      const codeVerifier = 'this_is_a_codeverifier';
      const code = 'this_is_a_code';
      const redirectUrl = 'this_is_a_redirectUrl';
      const clientId = 'this_is_a_clientId';
      flowsDataService.getCodeVerifier.and.returnValue(codeVerifier);
      flowsDataService.isSilentRenewRunning.and.returnValue(false);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId, redirectUrl });

      const result = service.createBodyForCodeFlowCodeRequest(code, 'configId');
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&redirect_uri=${redirectUrl}`;

      expect(result).toBe(expected);
    });

    it('returns correctUrl with silentRenewRunning is true', () => {
      const codeVerifier = 'this_is_a_codeverifier';
      const code = 'this_is_a_code';
      const silentRenewUrl = 'this_is_a_silentRenewUrl';
      const clientId = 'this_is_a_clientId';
      flowsDataService.getCodeVerifier.and.returnValue(codeVerifier);
      flowsDataService.isSilentRenewRunning.and.returnValue(true);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId, silentRenewUrl });

      const result = service.createBodyForCodeFlowCodeRequest(code, 'configId');
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&redirect_uri=${silentRenewUrl}`;

      expect(result).toBe(expected);
    });

    it('returns correctUrl when customTokenParams are provided', () => {
      const codeVerifier = 'this_is_a_codeverifier';
      const code = 'this_is_a_code';
      const silentRenewUrl = 'this_is_a_silentRenewUrl';
      const clientId = 'this_is_a_clientId';
      const customTokenParams = { foo: 'bar' };
      flowsDataService.getCodeVerifier.and.returnValue(codeVerifier);
      flowsDataService.isSilentRenewRunning.and.returnValue(true);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId, silentRenewUrl });

      const result = service.createBodyForCodeFlowCodeRequest(code, 'configId', customTokenParams);
      const expected = `grant_type=authorization_code&client_id=${clientId}&code_verifier=${codeVerifier}&code=${code}&foo=bar&redirect_uri=${silentRenewUrl}`;

      expect(result).toBe(expected);
    });
  });

  describe('createBodyForCodeFlowRefreshTokensRequest', () => {
    it('returns correct url', () => {
      const clientId = 'clientId';
      const refreshToken = 'refreshToken';
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId });
      const result = service.createBodyForCodeFlowRefreshTokensRequest(refreshToken, 'configId');
      expect(result).toBe(`grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}`);
    });

    it('returns correct url with custom params if custom params are passed', () => {
      const clientId = 'clientId';
      const refreshToken = 'refreshToken';
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId });
      const result = service.createBodyForCodeFlowRefreshTokensRequest(refreshToken, 'configId', { any: 'thing' });
      expect(result).toBe(`grant_type=refresh_token&client_id=${clientId}&refresh_token=${refreshToken}&any=thing`);
    });

    it('returns null if clientId is falsy', () => {
      const clientId = '';
      const refreshToken = 'refreshToken';
      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId });
      const result = service.createBodyForCodeFlowRefreshTokensRequest(refreshToken, 'configId');
      expect(result).toBe(null);
    });
  });

  describe('createBodyForParCodeFlowRequest', () => {
    it('returns null redirectUrl is falsy', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue({ redirectUrl: '' });

      const result = service.createBodyForParCodeFlowRequest('configId');

      expect(result).toBe(null);
    });

    it('returns basic url with no extras if properties are given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: null,
        customParams: null,
        redirectUrl: 'testRedirectUrl',
        configId: 'configId',
      });
      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue('testState');
      flowsDataService.createNonce.and.returnValue('testNonce');
      flowsDataService.createCodeVerifier.and.returnValue('testCodeVerifier');
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue('testCodeChallenge');

      const result = service.createBodyForParCodeFlowRequest('configId');
      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256`
      );
    });

    it('returns basic url with hdParam if properties are given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParams: null,
        redirectUrl: 'testRedirectUrl',
        configId: 'configId',
      });
      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue('testState');
      flowsDataService.createNonce.and.returnValue('testNonce');
      flowsDataService.createCodeVerifier.and.returnValue('testCodeVerifier');
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue('testCodeChallenge');

      const result = service.createBodyForParCodeFlowRequest('configId');
      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam`
      );
    });

    it('returns basic url with hdParam and custom params if properties are given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParams: { any: 'thing' },
        redirectUrl: 'testRedirectUrl',
        configId: 'configId',
      });
      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue('testState');
      flowsDataService.createNonce.and.returnValue('testNonce');
      flowsDataService.createCodeVerifier.and.returnValue('testCodeVerifier');
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue('testCodeChallenge');

      const result = service.createBodyForParCodeFlowRequest('configId');
      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam&any=thing`
      );
    });

    it('returns basic url with hdParam and custom params and passed cutom params if properties are given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        clientId: 'testClientId',
        responseType: 'testResponseType',
        scope: 'testScope',
        hdParam: 'testHdParam',
        customParams: { any: 'thing' },
        redirectUrl: 'testRedirectUrl',
      });
      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue('testState');
      flowsDataService.createNonce.and.returnValue('testNonce');
      flowsDataService.createCodeVerifier.and.returnValue('testCodeVerifier');
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue('testCodeChallenge');

      const result = service.createBodyForParCodeFlowRequest('configId', { any: 'otherThing' });
      expect(result).toBe(
        `client_id=testClientId&redirect_uri=testRedirectUrl&response_type=testResponseType&scope=testScope&nonce=testNonce&state=testState&code_challenge=testCodeChallenge&code_challenge_method=S256&hd=testHdParam&any=thing&any=otherThing`
      );
    });
  });

  describe('createUrlImplicitFlowWithSilentRenew', () => {
    it('returns null if silentrenewUrl is falsy', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = null;

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);

      configurationProvider.getOpenIDConfiguration.and.returnValue({
        silentRenewUrl,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowWithSilentRenew('configId');
      expect(result).toBeNull();
    });

    it('returns correct url if wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const scope = 'testScope';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        authorizationEndpoint,
      });
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        silentRenewUrl,
        clientId,
        responseType,
        scope,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowWithSilentRenew('configId');
      expect(result).toBe(
        `authorizationEndpoint?client_id=${clientId}&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&prompt=none`
      );
    });

    it('returns correct url if wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        silentRenewUrl,
        clientId,
        responseType,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowWithSilentRenew('configId');
      expect(result).toBe(null);
    });
  });

  describe('createUrlCodeFlowWithSilentRenew', () => {
    it('returns null if silentrenewUrl is falsy', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = null;
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);
      flowsDataService.createCodeVerifier.and.returnValue(codeVerifier);
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue(codeChallenge);

      configurationProvider.getOpenIDConfiguration.and.returnValue({
        silentRenewUrl,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlCodeFlowWithSilentRenew('configId');
      expect(result).toBeNull();
    });

    it('returns correct url if wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';
      const scope = 'testScope';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);
      flowsDataService.createCodeVerifier.and.returnValue(codeVerifier);
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue(codeChallenge);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ authorizationEndpoint });
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        silentRenewUrl,
        clientId,
        responseType,
        scope,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlCodeFlowWithSilentRenew('configId');
      expect(result).toBe(
        `authorizationEndpoint?client_id=${clientId}&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&prompt=none`
      );
    });

    it('returns empty string if no wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const silentRenewUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);
      flowsDataService.createCodeVerifier.and.returnValue(codeVerifier);
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue(codeChallenge);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ silentRenewUrl, clientId, responseType });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlCodeFlowWithSilentRenew('configId');
      expect(result).toBe(null);
    });
  });

  describe('createUrlImplicitFlowAuthorize', () => {
    it('returns correct url if wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const scope = 'testScope';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ authorizationEndpoint });
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        redirectUrl,
        clientId,
        responseType,
        scope,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowAuthorize('configId');
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

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ redirectUrl, clientId, responseType });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowAuthorize('configId');
      expect(result).toBe(null);
    });

    it('returns null if there is nor redirecturl', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = '';
      const clientId = 'clientId';
      const responseType = 'responseType';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ redirectUrl, clientId, responseType });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlImplicitFlowAuthorize('configId');
      expect(result).toBe(null);
    });
  });

  describe('createUrlCodeFlowAuthorize', () => {
    it('returns null if redirectUrl  is falsy', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = null;

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);

      configurationProvider.getOpenIDConfiguration.and.returnValue({
        redirectUrl,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlCodeFlowAuthorize('configId');
      expect(result).toBeNull();
    });

    it('returns correct url if wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const scope = 'testScope';
      const redirectUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);
      flowsDataService.createCodeVerifier.and.returnValue(codeVerifier);
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue(codeChallenge);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ authorizationEndpoint });
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        redirectUrl,
        clientId,
        responseType,
        scope,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlCodeFlowAuthorize('configId');
      expect(result).toBe(
        `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}`
      );
    });

    it('returns correct url if wellknownendpoints and custom params are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const scope = 'testScope';
      const redirectUrl = 'http://any-url.com';
      const authorizationEndpoint = 'authorizationEndpoint';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);
      flowsDataService.createCodeVerifier.and.returnValue(codeVerifier);
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue(codeChallenge);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({ authorizationEndpoint });
      configurationProvider.getOpenIDConfiguration.and.returnValue({
        redirectUrl,
        clientId,
        responseType,
        scope,
      });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlCodeFlowAuthorize('configId', { to: 'add', as: 'well' });
      expect(result).toBe(
        `authorizationEndpoint?client_id=clientId&redirect_uri=http%3A%2F%2Fany-url.com` +
          `&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&to=add&as=well`
      );
    });

    it('returns empty string if no wellknownendpoints are given', () => {
      const state = 'testState';
      const nonce = 'testNonce';
      const redirectUrl = 'http://any-url.com';
      const clientId = 'clientId';
      const responseType = 'responseType';
      const codeVerifier = 'codeVerifier';
      const codeChallenge = 'codeChallenge ';

      flowsDataService.getExistingOrCreateAuthStateControl.and.returnValue(state);
      flowsDataService.createNonce.and.returnValue(nonce);
      flowsDataService.createCodeVerifier.and.returnValue(codeVerifier);
      jsrsAsignReducedService.generateCodeChallenge.and.returnValue(codeChallenge);

      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);
      configurationProvider.getOpenIDConfiguration.and.returnValue({ redirectUrl, clientId, responseType });

      const serviceAsAny = service as any;

      const result = serviceAsAny.createUrlCodeFlowAuthorize('configId');
      expect(result).toBe(null);
    });
  });

  describe('createEndSessionUrl', () => {
    it('createEndSessionUrl create url when all parameters given', () => {
      const config = {
        stsServer: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        postLogoutRedirectUri: 'https://localhost:44386/Unauthorized',
        configId: 'configId',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        endSessionEndpoint: 'http://example',
      });

      const value = service.createEndSessionUrl('mytoken', 'configId');

      const expectValue = 'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

      expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl create url without postLogoutRedirectUri when not given', () => {
      const config = {
        stsServer: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        postLogoutRedirectUri: null,
        configId: 'configId',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        endSessionEndpoint: 'http://example',
      });

      const value = service.createEndSessionUrl('mytoken', 'configId');

      const expectValue = 'http://example?id_token_hint=mytoken';

      expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl appends custom params when some are passed', () => {
      const config = {
        stsServer: 'https://localhost:5001',
        redirectUrl: 'https://localhost:44386',
        clientId: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        responseType: 'id_token token',
        scope: 'openid email profile',
        postLogoutRedirectUri: null,
        configId: 'configId',
      };

      configurationProvider.getOpenIDConfiguration.and.returnValue(config);
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        endSessionEndpoint: 'http://example',
      });

      const value = service.createEndSessionUrl('mytoken', 'configId', { some: 'custom', params: 'forme' });

      const expectValue = 'http://example?id_token_hint=mytoken&some=custom&params=forme';

      expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl returns null if no wellknownEndpoints given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue({});

      const value = service.createEndSessionUrl('mytoken', 'configId');

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl returns null if no wellknownEndpoints.endSessionEndpoint given', () => {
      configurationProvider.getOpenIDConfiguration.and.returnValue({});
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        endSessionEndpoint: null,
      });

      const value = service.createEndSessionUrl('mytoken', 'configId');

      const expectValue = null;

      expect(value).toEqual(expectValue);
    });
  });

  describe('getAuthorizeParUrl', () => {
    it('returns null if authWellKnownEndPoints is undefined', () => {
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue(null);

      const result = service.getAuthorizeParUrl('', 'configId');

      expect(result).toBe(null);
    });

    it('returns null if authWellKnownEndPoints-authorizationEndpoint is undefined', () => {
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        notAuthorizationEndpoint: 'anything',
      });

      const result = service.getAuthorizeParUrl('', 'configId');

      expect(result).toBe(null);
    });

    it('returns null if configurationProvider.openIDConfiguration has no clientId', () => {
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        authorizationEndpoint: 'anything',
      });

      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId: null });
      const result = service.getAuthorizeParUrl('', 'configId');

      expect(result).toBe(null);
    });

    it('returns correct url when everything is given', () => {
      storagePersistenceService.read.withArgs('authWellKnownEndPoints', 'configId').and.returnValue({
        authorizationEndpoint: 'anything',
      });

      configurationProvider.getOpenIDConfiguration.and.returnValue({ clientId: 'clientId' });
      const result = service.getAuthorizeParUrl('passedRequestUri', 'configId');

      expect(result).toBe('anything?request_uri=passedRequestUri&client_id=clientId');
    });
  });
});
