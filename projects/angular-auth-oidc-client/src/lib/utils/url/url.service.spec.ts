import { TestBed } from '@angular/core/testing';
import { ConfigurationProvider } from '../../config';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LogLevel } from '../../logging/log-level';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { PlatformProvider } from '../platform-provider/platform.provider';
import { PlatformProviderMock } from '../platform-provider/platform.provider-mock';
import { UrlService } from './url.service';

describe('UrlService Tests', () => {
    let service: UrlService;
    let configurationProvider: ConfigurationProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ConfigurationProvider,
                UrlService,
                {
                    provide: LoggerService,
                    useClass: LoggerServiceMock,
                },
                { provide: PlatformProvider, useClass: PlatformProviderMock },
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(UrlService);
        configurationProvider = TestBed.inject(ConfigurationProvider);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
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

    it('createAuthorizeUrl with custom value', () => {
        const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
        config.redirectUrl = 'https://localhost:44386';
        config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.responseType = 'id_token token';
        config.scope = 'openid email profile';
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;
        config.customParams = {
            testcustom: 'customvalue',
        };

        configurationProvider.setConfig(config, { authorizationEndpoint: 'http://example' });

        const value = service.createAuthorizeUrl(
            '', // Implicit Flow
            config.redirectUrl,
            'nonce',
            'state'
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
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;
        config.customParams = {
            t4: 'ABC abc 123',
            t3: '#',
            t2: '-_.!~*()',
            t1: ';,/?:@&=+$',
        };

        configurationProvider.setConfig(config, { authorizationEndpoint: 'http://example' });

        const value = service.createAuthorizeUrl(
            '', // Implicit Flow
            config.redirectUrl,
            'nonce',
            'state'
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

    it('createEndSessionUrl default', () => {
        const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
        config.redirectUrl = 'https://localhost:44386';
        config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.responseType = 'id_token token';
        config.scope = 'openid email profile';
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configurationProvider.setConfig(config, null);

        const value = service.createEndSessionUrl('http://example', 'mytoken');

        const expectValue = 'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

        expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl default', () => {
        // let well = '{
        // 	"issuer":"https://accounts.google.com",
        // 	"authorization_endpoint":"https://accounts.google.com/o/oauth2/v2/auth",
        // 	"token_endpoint":"https://www.googleapis.com/oauth2/v4/token",
        // 	"userinfo_endpoint":"https://www.googleapis.com/oauth2/v3/userinfo",
        // 	"revocation_endpoint":"https://accounts.google.com/o/oauth2/revoke",
        // 	"jwks_uri":"https://www.googleapis.com/oauth2/v3/certs",
        // 	"response_types_supported":[ "code", "token", "id_token", "codetoken", "codeid_token", "tokenid_token", "codetokenid_token",
        // "none" ],
        // 	"subject_types_supported":[ "public" ],
        // 	"id_token_signing_alg_values_supported":[ "RS256" ],
        // 	"scopes_supported":[ "openid", "email", "profile" ],
        // 	"token_endpoint_auth_methods_supported":[ "client_secret_post", "client_secret_basic" ],
        // 	"claims_supported":[ "aud", "email", "email_verified", "exp", "family_name", "given_name", "iat", "iss","locale",
        // "name", "picture", "sub"],
        // 	"code_challenge_methods_supported":["plain","S256"]}';
        // (oidcSecurityService as any).oidcSecurityCommon.store('wellknownendpoints', well);

        const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
        config.redirectUrl = 'https://localhost:44386';
        config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.responseType = 'id_token token';
        config.scope = 'openid email profile';
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configurationProvider.setConfig(config, { authorizationEndpoint: 'http://example' });

        const value = service.createAuthorizeUrl(
            '', // Implicit Flow
            config.redirectUrl,
            'nonce',
            'state'
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

    // https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
    it('createAuthorizeUrl with custom url like active-directory-b2c', () => {
        const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
        config.redirectUrl = 'https://localhost:44386';
        config.clientId = 'myid';
        config.responseType = 'id_token token';
        config.scope = 'openid email profile';
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configurationProvider.setConfig(config, {
            authorizationEndpoint: 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in',
        });

        const value = service.createAuthorizeUrl(
            '', // Implicit Flow
            config.redirectUrl,
            'nonce',
            'state'
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

    it('createEndSessionUrl with azure-ad-b2c policy parameter', () => {
        const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
        config.redirectUrl = 'https://localhost:44386';
        config.clientId = 'myid';
        config.responseType = 'id_token token';
        config.scope = 'openid email profile';
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configurationProvider.setConfig(config, null);

        const value = service.createEndSessionUrl(
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in',
            'UzI1NiIsImtpZCI6Il'
        );

        const expectValue =
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in' +
            '&id_token_hint=UzI1NiIsImtpZCI6Il' +
            '&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

        expect(value).toEqual(expectValue);
    });
});
