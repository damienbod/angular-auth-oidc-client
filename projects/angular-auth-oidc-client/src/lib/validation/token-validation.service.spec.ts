import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthModule } from '../auth.module';
import { ConfigurationProvider } from '../config';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LogLevel } from '../logging/log-level';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { AbstractSecurityStorage } from '../storage';
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

        configProvider.setConfig(config, null);

        const dataIdToken = { aud: 'banana' };
        const valueTrue = tokenvalidationService.validateIdTokenAud(dataIdToken, 'banana');
        expect(valueTrue).toEqual(true);

        const valueFalse = tokenvalidationService.validateIdTokenAud(dataIdToken, 'bananammmm');
        expect(valueFalse).toEqual(false);
    });

    it('validate aud array', () => {
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

        configProvider.setConfig(config, null);

        const dataIdToken = {
            aud: ['banana', 'apple', 'https://nice.dom'],
        };
        const valueTrue = tokenvalidationService.validateIdTokenAud(dataIdToken, ['banana', 'apple', 'https://nice.dom']);
        expect(valueTrue).toEqual(true);

        const valueFalse = tokenvalidationService.validateIdTokenAud(dataIdToken, ['ooo', 'apple', 'https://nice.dom']);
        expect(valueFalse).toEqual(false);
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
});
