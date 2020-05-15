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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
            tokenvalidationService.validateIdTokenNonce({ nonce: undefined }, TokenValidationService.RefreshTokenNoncePlaceholder, false)
        ).toBe(true);
    });

    it('should validate id token nonce after refresh token grant when undefined and ignore', () => {
        expect(
            tokenvalidationService.validateIdTokenNonce({ nonce: undefined }, TokenValidationService.RefreshTokenNoncePlaceholder, true)
        ).toBe(true);
    });

    it('should validate id token nonce after refresh token grant when defined and ignore', () => {
        expect(
            tokenvalidationService.validateIdTokenNonce({ nonce: 'test1' }, TokenValidationService.RefreshTokenNoncePlaceholder, true)
        ).toBe(true);
    });

    it('should not validate id token nonce after refresh token grant when defined and no ignore', () => {
        expect(
            tokenvalidationService.validateIdTokenNonce({ nonce: 'test1' }, TokenValidationService.RefreshTokenNoncePlaceholder, false)
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
        config.logLevel = LogLevel.Debug;
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
});
