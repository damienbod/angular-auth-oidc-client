import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthModule } from '../lib/auth.module';
import { ConfigurationProvider } from '../lib/config';
import { OpenIdConfiguration } from '../lib/config/openid-configuration';
import { LogLevel } from '../lib/logging/log-level';
import { LoggerService } from '../lib/logging/logger.service';
import { TestLogging } from '../lib/logging/logger.service-mock';
import { OidcSecurityValidation } from '../lib/services/oidc.security.validation';
import { AbstractSecurityStorage } from '../lib/storage';
import { BrowserStorageMock } from '../lib/storage/browser-storage.service-mock';
import { EqualityHelperService } from '../lib/utils/equality/oidc-equality-helper.service';

describe('OidcSecurityValidation', () => {
    let oidcSecurityValidation: OidcSecurityValidation;
    let configProvider: ConfigurationProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                ConfigurationProvider,
                EqualityHelperService,
                OidcSecurityValidation,
                {
                    provide: AbstractSecurityStorage,
                    useClass: BrowserStorageMock,
                },
                {
                    provide: LoggerService,
                    useClass: TestLogging,
                },
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityValidation = TestBed.inject(OidcSecurityValidation);
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
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config, null);

        const dataIdToken = { aud: 'banana' };
        const valueTrue = oidcSecurityValidation.validateIdTokenAud(dataIdToken, 'banana');
        expect(valueTrue).toEqual(true);

        const valueFalse = oidcSecurityValidation.validateIdTokenAud(dataIdToken, 'bananammmm');
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
        config.silentRenewOffsetInSeconds = 0;
        config.logLevel = LogLevel.Debug;
        config.maxIdTokenIatOffsetAllowedInSeconds = 10;

        configProvider.setConfig(config, null);

        const dataIdToken = {
            aud: ['banana', 'apple', 'https://nice.dom'],
        };
        const valueTrue = oidcSecurityValidation.validateIdTokenAud(dataIdToken, ['banana', 'apple', 'https://nice.dom']);
        expect(valueTrue).toEqual(true);

        const valueFalse = oidcSecurityValidation.validateIdTokenAud(dataIdToken, ['ooo', 'apple', 'https://nice.dom']);
        expect(valueFalse).toEqual(false);
    });

    it('should validate id token nonce after code grant when match', () => {
        expect(oidcSecurityValidation.validateIdTokenNonce({ nonce: 'test1' }, 'test1', false)).toBe(true);
    });

    it('should not validate id token nonce after code grant when no match', () => {
        expect(oidcSecurityValidation.validateIdTokenNonce({ nonce: 'test1' }, 'test2', false)).toBe(false);
    });

    it('should validate id token nonce after refresh token grant when undefined and no ignore', () => {
        expect(
            oidcSecurityValidation.validateIdTokenNonce({ nonce: undefined }, OidcSecurityValidation.RefreshTokenNoncePlaceholder, false)
        ).toBe(true);
    });

    it('should validate id token nonce after refresh token grant when undefined and ignore', () => {
        expect(
            oidcSecurityValidation.validateIdTokenNonce({ nonce: undefined }, OidcSecurityValidation.RefreshTokenNoncePlaceholder, true)
        ).toBe(true);
    });

    it('should validate id token nonce after refresh token grant when defined and ignore', () => {
        expect(
            oidcSecurityValidation.validateIdTokenNonce({ nonce: 'test1' }, OidcSecurityValidation.RefreshTokenNoncePlaceholder, true)
        ).toBe(true);
    });

    it('should not validate id token nonce after refresh token grant when defined and no ignore', () => {
        expect(
            oidcSecurityValidation.validateIdTokenNonce({ nonce: 'test1' }, OidcSecurityValidation.RefreshTokenNoncePlaceholder, false)
        ).toBe(false);
    });
});
