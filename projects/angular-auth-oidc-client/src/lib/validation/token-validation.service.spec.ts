/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthModule } from '../auth.module';
import { ConfigurationProvider } from '../config/config.provider';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LogLevel } from '../logging/log-level';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { BrowserStorageMock } from '../storage/browser-storage.service-mock';
import { EqualityService } from '../utils/equality/equality.service';
import { FlowHelper } from './../utils/flowHelper/flow-helper.service';
import { TokenValidationService } from './token-validation.service';

describe('TokenValidationService', () => {
    let tokenvalidationService: TokenValidationService;
    let configProvider: ConfigurationProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                ConfigurationProvider,
                EqualityService,
                TokenValidationService,
                {
                    provide: AbstractSecurityStorage,
                    useClass: BrowserStorageMock,
                },
                {
                    provide: LoggerService,
                    useClass: LoggerServiceMock,
                },
                FlowHelper,
            ],
        });
    });

    beforeEach(() => {
        tokenvalidationService = TestBed.inject(TokenValidationService);
        configProvider = TestBed.inject(ConfigurationProvider);
    });

    it('validate aud string', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const dataIdToken = { aud: 'banana' };
        const valueTrue = tokenvalidationService.validateIdTokenAud(dataIdToken, 'banana');
        expect(valueTrue).toEqual(true);

        const valueFalse = tokenvalidationService.validateIdTokenAud(dataIdToken, 'bananammmm');
        expect(valueFalse).toEqual(false);
    });

    it('validate aud array and azp', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const dataIdToken = {
            aud: ['banana', 'apple', 'https://nice.dom'],
            azp: 'apple',
        };
        const audValidTrue = tokenvalidationService.validateIdTokenAud(dataIdToken, 'apple');
        expect(audValidTrue).toEqual(true);

        const audValidFalse = tokenvalidationService.validateIdTokenAud(dataIdToken, 'https://nice.domunnnnnnkoem');
        expect(audValidFalse).toEqual(false);
    });

    it('should validate id token nonce after code grant when match', () => {
        expect(tokenvalidationService.validateIdTokenNonce({ nonce: 'test1' }, 'test1', false)).toBe(true);
    });

    it('should not validate id token nonce after code grant when no match', () => {
        expect(tokenvalidationService.validateIdTokenNonce({ nonce: 'test1' }, 'test2', false)).toBe(false);
    });

    it('should validate id token nonce after refresh token grant when undefined and no ignore', () => {
        expect(
            tokenvalidationService.validateIdTokenNonce({ nonce: undefined }, TokenValidationService.refreshTokenNoncePlaceholder, false)
        ).toBe(true);
    });

    it('should validate id token nonce after refresh token grant when undefined and ignore', () => {
        expect(
            tokenvalidationService.validateIdTokenNonce({ nonce: undefined }, TokenValidationService.refreshTokenNoncePlaceholder, true)
        ).toBe(true);
    });

    it('should validate id token nonce after refresh token grant when defined and ignore', () => {
        expect(
            tokenvalidationService.validateIdTokenNonce({ nonce: 'test1' }, TokenValidationService.refreshTokenNoncePlaceholder, true)
        ).toBe(true);
    });

    it('should not validate id token nonce after refresh token grant when defined and no ignore', () => {
        expect(
            tokenvalidationService.validateIdTokenNonce({ nonce: 'test1' }, TokenValidationService.refreshTokenNoncePlaceholder, false)
        ).toBe(false);
    });

    it('validate aud array and azp', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const dataIdToken = {
            aud: ['banana', 'apple', '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com'],
            azp: '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com',
        };
        const valueTrue = tokenvalidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);
        expect(valueTrue).toEqual(true);

        const azpInvalid = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'bananammmm');
        expect(azpInvalid).toEqual(false);

        const azpValid = tokenvalidationService.validateIdTokenAzpValid(
            dataIdToken,
            '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com'
        );
        expect(azpValid).toEqual(true);
    });

    it('validate string aud and no azp', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const dataIdToken = {
            aud: 'banana',
        };
        const valueTrue = tokenvalidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);
        expect(valueTrue).toEqual(true);

        const azpValid = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'bananammmm');
        expect(azpValid).toEqual(true);

        const azpValid2 = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'banana');
        expect(azpValid2).toEqual(true);

        const azpValid3 = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'fdfddlfkdlfkds');
        expect(azpValid3).toEqual(true);
    });

    it('validate array aud with 1 item and no azp', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const dataIdToken = {
            aud: ['banana'],
        };
        const valueTrue = tokenvalidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);
        expect(valueTrue).toEqual(true);

        const azpValid = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'bananammmm');
        expect(azpValid).toEqual(true);

        const azpValid2 = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'banana');
        expect(azpValid2).toEqual(true);

        const azpValid3 = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'fdfddlfkdlfkds');
        expect(azpValid3).toEqual(true);

        const valueAud = tokenvalidationService.validateIdTokenAud(dataIdToken, 'banana');
        expect(valueAud).toEqual(true);
    });

    it('validate string aud and no azp', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const dataIdToken = {
            aud: 'banana',
        };
        const valueTrue = tokenvalidationService.validateIdTokenAzpExistsIfMoreThanOneAud(dataIdToken);
        expect(valueTrue).toEqual(true);

        const azpValid = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'bananammmm');
        expect(azpValid).toEqual(true);

        const azpValid2 = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'banana');
        expect(azpValid2).toEqual(true);

        const azpValid3 = tokenvalidationService.validateIdTokenAzpValid(dataIdToken, 'fdfddlfkdlfkds');
        expect(azpValid3).toEqual(true);
    });

    it('validateRequiredIdToken valid id_token', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            iat: 1589206486,
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueTrue = tokenvalidationService.validateRequiredIdToken(decodedIdToken);
        expect(valueTrue).toEqual(true);
    });

    it('validateRequiredIdToken invalid id_token missing iss', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            iat: 1589206486,
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueFalse = tokenvalidationService.validateRequiredIdToken(decodedIdToken);
        expect(valueFalse).toEqual(false);
    });

    it('validateRequiredIdToken invalid id_token missing sub', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            iat: 1589206486,
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueFalse = tokenvalidationService.validateRequiredIdToken(decodedIdToken);
        expect(valueFalse).toEqual(false);
    });

    it('validateRequiredIdToken invalid id_token missing aud', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            iat: 1589206486,
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueFalse = tokenvalidationService.validateRequiredIdToken(decodedIdToken);
        expect(valueFalse).toEqual(false);
    });

    it('validateRequiredIdToken invalid id_token missing exp', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            nbf: 1589206486,
            ver: '1.0',
            iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            iat: 1589206486,
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueFalse = tokenvalidationService.validateRequiredIdToken(decodedIdToken);
        expect(valueFalse).toEqual(false);
    });

    it('validateRequiredIdToken invalid id_token missing iat', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            iss: 'https://damienbod.b2clogin.com/a0958f45-195b-4036-9259-de2f7e594db6/v2.0/',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueFalse = tokenvalidationService.validateRequiredIdToken(decodedIdToken);
        expect(valueFalse).toEqual(false);
    });

    it('validateIdTokenIss invalid id_token matching iss', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            iss: 'xc',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueTrue = tokenvalidationService.validateIdTokenIss(decodedIdToken, 'xc');
        expect(valueTrue).toEqual(true);
    });

    it('validateIdTokenIss invalid id_token not matching iss', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            iss: 'xc',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueFalse = tokenvalidationService.validateIdTokenIss(decodedIdToken, 'xcjjjj');
        expect(valueFalse).toEqual(false);
    });

    it('validateIdTokenIatMaxOffset', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const decodedIdToken = {
            exp: 1589210086,
            nbf: 1589206486,
            iat: 1589206486,
            ver: '1.0',
            iss: 'xc',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueTrueDis = tokenvalidationService.validateIdTokenIatMaxOffset(decodedIdToken, 5, true);
        expect(valueTrueDis).toEqual(true);

        const valueTrue = tokenvalidationService.validateIdTokenIatMaxOffset(decodedIdToken, 500000000000, false);
        expect(valueTrue).toEqual(true);

        const decodedIdTokenNegIat = {
            exp: 1589210086,
            nbf: 1589206486,
            iat: 500348877430,
            ver: '1.0',
            iss: 'xc',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };
        const valueFalseNeg = tokenvalidationService.validateIdTokenIatMaxOffset(decodedIdTokenNegIat, 0, false);
        expect(valueFalseNeg).toEqual(false);

        const valueFalse = tokenvalidationService.validateIdTokenIatMaxOffset(decodedIdToken, 5, false);
        expect(valueFalse).toEqual(false);

        const decodedIdTokenMissingIat = {
            exp: 1589210086,
            nbf: 1589206486,
            ver: '1.0',
            iss: 'xc',
            sub: 'f836f380-3c64-4802-8dbc-011981c068f5',
            aud: 'bad',
            nonce: '007c4153b6a0517c0e497476fb249948ec5clOvQQ',
            auth_time: 1589206488,
            name: 'damienbod',
            emails: ['damien@damienbod.onmicrosoft.com'],
            tfp: 'B2C_1_b2cpolicydamien',
            at_hash: 'Zk0fKJS_pYhOpM8IBa12fw',
        };

        const valueFalseMissingIatToken = tokenvalidationService.validateIdTokenIatMaxOffset(decodedIdTokenMissingIat, 5, false);
        expect(valueFalseMissingIatToken).toEqual(false);
    });

    it('validateSignatureIdToken', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const valueFalse = tokenvalidationService.validateSignatureIdToken(null, null);
        expect(valueFalse).toEqual(false);

        const valueFalse2 = tokenvalidationService.validateSignatureIdToken(null, { te: '' });
        expect(valueFalse2).toEqual(false);

        const idToken =
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';

        const idTokenGood =
            'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU2MjZDRTZBOEY0RjVGQ0Q3OUM2NjQyMzQ1MjgyQ0E3NkQzMzc1NDgiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJWaWJPYW85UFg4MTV4bVFqUlNnc3AyMHpkVWcifQ.eyJuYmYiOjE1ODk1NTYxODYsImV4cCI6MTU4OTU1NjIxNiwiaXNzIjoiaHR0cHM6Ly9vZmZlcmluZ3NvbHV0aW9ucy1zdHMuYXp1cmV3ZWJzaXRlcy5uZXQiLCJhdWQiOiJhbmd1bGFyQ2xpZW50Iiwibm9uY2UiOiI3YmJjMWUzNDdhNjEzNzM2MmJhMGNmZGE4ZDMxZjllNjQ1UGhVZ0VIRCIsImlhdCI6MTU4OTU1NjE4NiwiYXRfaGFzaCI6IjNnbUdCTlhZVDFnS2liYXNIOFpVVHciLCJzX2hhc2giOiJ4VUZyY2o0a1hieU5MS3VNRFJKYlJBIiwic2lkIjoiaWRpeEtiQ28ySnBJY05RMlNWX0M3QSIsInN1YiI6IjMzNGM2MGM4LWZjNWQtNDI4Yy04NmFhLWJhZmMxYjQ0MWZiNCIsImF1dGhfdGltZSI6MTU4OTU0OTMzNywiaWRwIjoibG9jYWwiLCJhbXIiOlsicHdkIl19.Oj2zm5HsR9VKBnjGMUR08SWv8ZEx5tRivfAv5seEmkWMBkCcmveTsoGKa5CnDOw-bMz08qBGRtojAHSkwsWMI6QycrHr_sAApBu7ZJqEIwRgr4rKhbZKQTkjIH5kWZMG6N27t2CWD49hHvPStC30hN9SgnUYFRaAynYJSTCKsOhicD71ICEp8dYolj1tt6U7YX8ul24NQI1mKFpfIvVDkhhE1IGZolwiYFtKxhoEM-Q_KFj0OIx-Tg6eVnwKUEzCupShmgCaMNsv2H-wXgUBF9BYzFnQTcyb7WGcW9261pGDN4dgLDUaDwEY8abpXGTlg3AbnZcxeLl6jo1IGVP5aA';

        const jwtKeys = {
            keys: [
                {
                    kty: 'RSA',
                    use: 'sig',
                    kid: '5626CE6A8F4F5FCD79C6642345282CA76D337548',
                    x5t: 'VibOao9PX815xmQjRSgsp20zdUg',
                    e: 'AQAB',
                    n:
                        'uu3-HK4pLRHJHoEBzFhM516RWx6nybG5yQjH4NbKjfGQ8dtKy1BcGjqfMaEKF8KOK44NbAx7rtBKCO9EKNYkeFvcUzBzVeuu4jWG61XYdTekgv-Dh_Fj8245GocEkbvBbFW6cw-_N59JWqUuiCvb-EOfhcuubUcr44a0AQyNccYNpcXGRcMKy7_L1YhO0AMULqLDDVLFj5glh4TcJ2N5VnJedq1-_JKOxPqD1ni26UOQoWrW16G29KZ1_4Xxf2jX8TAq-4RJEHccdzgZVIO4F5B4MucMZGq8_jMCpiTUsUGDOAMA_AmjxIRHOtO5n6Pt0wofrKoAVhGh2sCTtaQf2Q',
                    x5c: [
                        'MIIDPzCCAiegAwIBAgIQF+HRVxLHII9IlOoQk6BxcjANBgkqhkiG9w0BAQsFADAbMRkwFwYDVQQDDBBzdHMuZGV2LmNlcnQuY29tMB4XDTE5MDIyMDEwMTA0M1oXDTM5MDIyMDEwMTkyOVowGzEZMBcGA1UEAwwQc3RzLmRldi5jZXJ0LmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALrt/hyuKS0RyR6BAcxYTOdekVsep8mxuckIx+DWyo3xkPHbSstQXBo6nzGhChfCjiuODWwMe67QSgjvRCjWJHhb3FMwc1XrruI1hutV2HU3pIL/g4fxY/NuORqHBJG7wWxVunMPvzefSVqlLogr2/hDn4XLrm1HK+OGtAEMjXHGDaXFxkXDCsu/y9WITtADFC6iww1SxY+YJYeE3CdjeVZyXnatfvySjsT6g9Z4tulDkKFq1tehtvSmdf+F8X9o1/EwKvuESRB3HHc4GVSDuBeQeDLnDGRqvP4zAqYk1LFBgzgDAPwJo8SERzrTuZ+j7dMKH6yqAFYRodrAk7WkH9kCAwEAAaN/MH0wDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAtBgNVHREEJjAkghBzdHMuZGV2LmNlcnQuY29tghBzdHMuZGV2LmNlcnQuY29tMB0GA1UdDgQWBBQuyHxWP3je6jGMOmOiY+hz47r36jANBgkqhkiG9w0BAQsFAAOCAQEAKEHG7Ga6nb2XiHXDc69KsIJwbO80+LE8HVJojvITILz3juN6/FmK0HmogjU6cYST7m1MyxsVhQQNwJASZ6haBNuBbNzBXfyyfb4kr62t1oDLNwhctHaHaM4sJSf/xIw+YO+Qf7BtfRAVsbM05+QXIi2LycGrzELiXu7KFM0E1+T8UOZ2Qyv7OlCb/pWkYuDgE4w97ox0MhDpvgluxZLpRanOLUCVGrfFaij7gRAhjYPUY3vAEcD8JcFBz1XijU8ozRO6FaG4qg8/JCe+VgoWsMDj3sKB9g0ob6KCyG9L2bdk99PGgvXDQvMYCpkpZzG3XsxOINPd5p0gc209ZOoxTg==',
                    ],
                    alg: 'RS256',
                },
            ],
        };

        const valueFalse3 = tokenvalidationService.validateSignatureIdToken(idToken, jwtKeys);
        expect(valueFalse3).toEqual(false);

        const valueTrue = tokenvalidationService.validateSignatureIdToken(idTokenGood, jwtKeys);
        expect(valueTrue).toEqual(true);
    });

    it('validateIdTokenAtHash', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const token =
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';

        const accessToken = 'iGU3DhbPoDljiYtr0oepxi7zpT8BsjdU7aaXcdq-DPk';
        const atHash = '-ODC_7Go_UIUTC8nP4k2cA';

        const good = tokenvalidationService.validateIdTokenAtHash(accessToken, atHash, '256');
        expect(good).toEqual(true);

        const valueFalse1 = tokenvalidationService.validateIdTokenAtHash(token, 'bad', '256');
        expect(valueFalse1).toEqual(false);

        const valueFalse2 = tokenvalidationService.validateIdTokenAtHash(token, 'bad', '384');
        expect(valueFalse2).toEqual(false);

        const valueFalse3 = tokenvalidationService.validateIdTokenAtHash(token, 'bad', '512');
        expect(valueFalse3).toEqual(false);
    });

    it('validateStateFromHashCallback', () => {
        const good = tokenvalidationService.validateStateFromHashCallback('sssd', 'sssd');
        expect(good).toEqual(true);

        const test: any = 'sssd';
        const good1 = tokenvalidationService.validateStateFromHashCallback('sssd', test);
        expect(good1).toEqual(true);

        const bad = tokenvalidationService.validateStateFromHashCallback('sssd', 'bad');
        expect(bad).toEqual(false);
    });

    it('configValidateResponseType', () => {
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
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const good1 = tokenvalidationService.configValidateResponseType('id_token token');
        expect(good1).toEqual(true);
    });

    it('configValidateResponseType', () => {
        const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
        config.redirectUrl = 'https://localhost:44386';
        config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.responseType = 'code';
        config.scope = 'openid email profile';
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const good1 = tokenvalidationService.configValidateResponseType('code');
        expect(good1).toEqual(true);
    });

    it('configValidateResponseType', () => {
        const config = { stsServer: 'https://localhost:5001' } as OpenIdConfiguration;
        config.redirectUrl = 'https://localhost:44386';
        config.clientId = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.responseType = 'code id_token';
        config.scope = 'openid email profile';
        config.postLogoutRedirectUri = 'https://localhost:44386/Unauthorized';
        config.postLoginRoute = '/home';
        config.forbiddenRoute = '/Forbidden';
        config.unauthorizedRoute = '/Unauthorized';
        config.startCheckSession = false;
        config.silentRenew = false;
        config.renewTimeBeforeTokenExpiresInSeconds = 0;
        config.logLevel = LogLevel.debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config);

        const bad = tokenvalidationService.configValidateResponseType('code id_token');
        expect(bad).toEqual(false);
    });

    it('generateCodeChallenge', () => {
        const good = tokenvalidationService.generateCodeChallenge('44445543344242132145455aaabbdc3b4');
        expect(good).toEqual('R2TWD45Vtcf_kfAqjuE3LMSRF3JDE5fsFndnn6-a0nQ');

        const bad = tokenvalidationService.generateCodeChallenge('44445543344242132145455aaabbdc3b4');
        expect(bad === 'bad').toBeFalse();
    });

    it('validateIdTokenExpNotExpired', () => {
        const idToken =
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ilg1ZVhrNHh5b2pORnVtMWtsMll0djhkbE5QNC1jNTdkTzZRR1RWQndhTmsifQ.eyJleHAiOjE1ODkyMTAwODYsIm5iZiI6MTU4OTIwNjQ4NiwidmVyIjoiMS4wIiwiaXNzIjoiaHR0cHM6Ly9kYW1pZW5ib2QuYjJjbG9naW4uY29tL2EwOTU4ZjQ1LTE5NWItNDAzNi05MjU5LWRlMmY3ZTU5NGRiNi92Mi4wLyIsInN1YiI6ImY4MzZmMzgwLTNjNjQtNDgwMi04ZGJjLTAxMTk4MWMwNjhmNSIsImF1ZCI6ImYxOTM0YTZlLTk1OGQtNDE5OC05ZjM2LTYxMjdjZmM0Y2RiMyIsIm5vbmNlIjoiMDA3YzQxNTNiNmEwNTE3YzBlNDk3NDc2ZmIyNDk5NDhlYzVjbE92UVEiLCJpYXQiOjE1ODkyMDY0ODYsImF1dGhfdGltZSI6MTU4OTIwNjQ4NiwibmFtZSI6ImRhbWllbmJvZCIsImVtYWlscyI6WyJkYW1pZW5AZGFtaWVuYm9kLm9ubWljcm9zb2Z0LmNvbSJdLCJ0ZnAiOiJCMkNfMV9iMmNwb2xpY3lkYW1pZW4iLCJhdF9oYXNoIjoiWmswZktKU19wWWhPcE04SUJhMTJmdyJ9.E5Z-0kOzNU7LBkeVHHMyNoER8TUapGzUUfXmW6gVu4v6QMM5fQ4sJ7KC8PHh8lBFYiCnaDiTtpn3QytUwjXEFnLDAX5qcZT1aPoEgL_OmZMC-8y-4GyHp35l7VFD4iNYM9fJmLE8SYHTVl7eWPlXSyz37Ip0ciiV0Fd6eoksD_aVc-hkIqngDfE4fR8ZKfv4yLTNN_SfknFfuJbZ56yN-zIBL4GkuHsbQCBYpjtWQ62v98p1jO7NhHKV5JP2ec_Ge6oYc_bKTrE6OIX38RJ2rIm7zU16mtdjnl_350Nw3ytHcTPnA1VpP_VLElCfe83jr5aDHc_UQRYaAcWlOgvmVg';

        const notExpired = tokenvalidationService.validateIdTokenExpNotExpired(idToken, 0);
        expect(notExpired).toEqual(false);
    });

    it('validateAccessTokenNotExpired', () => {
        const notExpired = tokenvalidationService.validateAccessTokenNotExpired(new Date(1589210086), 0);
        expect(notExpired).toEqual(false);

        const notExpired3 = tokenvalidationService.validateAccessTokenNotExpired(new Date(2550, 10), 0);
        expect(notExpired3).toEqual(true);

        const notExpired2 = tokenvalidationService.validateAccessTokenNotExpired(null, 300);
        expect(notExpired2).toEqual(true);
    });
});
