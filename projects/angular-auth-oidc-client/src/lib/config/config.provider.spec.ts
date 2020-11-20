import { TestBed } from '@angular/core/testing';
import { LogLevel } from '../logging/log-level';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { ConfigurationProvider } from './config.provider';
import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';

describe('ConfigurationProviderTests', () => {
    let configurationProvider: ConfigurationProvider;
    let platformProvider: PlatformProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConfigurationProvider, PlatformProvider],
        });
    });

    beforeEach(() => {
        configurationProvider = TestBed.inject(ConfigurationProvider);
        platformProvider = TestBed.inject(PlatformProvider);
    });

    it('should create', () => {
        expect(configurationProvider).toBeTruthy();
    });

    it('setup defines openIDConfiguration', () => {
        configurationProvider.setConfig({ stsServer: 'hello' });

        expect(configurationProvider.openIDConfiguration).toBeDefined();
    });

    it('hasValidConfig is true if config is set', () => {
        configurationProvider.setConfig({ stsServer: 'hello' });

        expect(configurationProvider.hasValidConfig()).toBeTrue();
    });

    it('get openIDConfiguration returns null when openIdConfigurationInternal is falsy', () => {
        // do not set anything
        expect(configurationProvider.openIDConfiguration).toBeNull();
    });

    it('setup defines default openIDConfiguration', () => {
        const defaultConfig: OpenIdConfiguration = {
            stsServer: 'https://please_set',
            authWellknownEndpoint: '',
            redirectUrl: 'https://please_set',
            clientId: 'please_set',
            responseType: 'code',
            scope: 'openid email profile',
            hdParam: '',
            postLogoutRedirectUri: 'https://please_set',
            startCheckSession: false,
            silentRenew: false,
            silentRenewUrl: 'https://please_set',
            renewTimeBeforeTokenExpiresInSeconds: 0,
            useRefreshToken: false,
            ignoreNonceAfterRefresh: false,
            postLoginRoute: '/',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            autoUserinfo: true,
            autoCleanStateAfterAuthentication: true,
            triggerAuthorizationResultEvent: false,
            logLevel: LogLevel.Warn,
            issValidationOff: false,
            historyCleanupOff: false,
            maxIdTokenIatOffsetAllowedInSeconds: 120,
            disableIatOffsetValidation: false,
            storage: sessionStorage,
            customParams: {},
            eagerLoadAuthWellKnownEndpoints: true,
            disableRefreshIdTokenAuthTimeValidation: false,
            tokenRefreshInSeconds: 3,
        };

        configurationProvider.setConfig({ stsServer: 'https://please_set' });

        expect(configurationProvider.openIDConfiguration).toEqual(defaultConfig);
    });

    it('setup merges default and passed config', () => {
        const config = {
            stsServer: 'stsServer',
        };

        const expected = {
            stsServer: config.stsServer,
            authWellknownEndpoint: '',
            redirectUrl: 'https://please_set',
            clientId: 'please_set',
            responseType: 'code',
            scope: 'openid email profile',
            hdParam: '',
            postLogoutRedirectUri: 'https://please_set',
            startCheckSession: false,
            silentRenew: false,
            silentRenewUrl: 'https://please_set',
            renewTimeBeforeTokenExpiresInSeconds: 0,
            useRefreshToken: false,
            ignoreNonceAfterRefresh: false,
            postLoginRoute: '/',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            autoUserinfo: true,
            autoCleanStateAfterAuthentication: true,
            triggerAuthorizationResultEvent: false,
            logLevel: LogLevel.Warn,
            issValidationOff: false,
            historyCleanupOff: false,
            maxIdTokenIatOffsetAllowedInSeconds: 120,
            disableIatOffsetValidation: false,
            storage: sessionStorage,
            customParams: {},
            eagerLoadAuthWellKnownEndpoints: true,
            disableRefreshIdTokenAuthTimeValidation: false,
            tokenRefreshInSeconds: 3,
        };

        configurationProvider.setConfig(config);

        expect(configurationProvider.openIDConfiguration).toEqual(expected);
    });

    it('setup sets special cases', () => {
        const config = {
            stsServer: 'stsServer',
            startCheckSession: true,
            silentRenew: true,
        };

        const expected = {
            stsServer: config.stsServer,
            authWellknownEndpoint: '',
            redirectUrl: 'https://please_set',
            clientId: 'please_set',
            responseType: 'code',
            scope: 'openid email profile',
            hdParam: '',
            postLogoutRedirectUri: 'https://please_set',
            startCheckSession: false,
            silentRenew: false,
            silentRenewUrl: 'https://please_set',
            renewTimeBeforeTokenExpiresInSeconds: 0,
            useRefreshToken: false,
            ignoreNonceAfterRefresh: false,
            postLoginRoute: '/',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            autoUserinfo: true,
            autoCleanStateAfterAuthentication: true,
            triggerAuthorizationResultEvent: false,
            logLevel: LogLevel.Warn,
            issValidationOff: false,
            historyCleanupOff: false,
            maxIdTokenIatOffsetAllowedInSeconds: 120,
            disableIatOffsetValidation: false,
            storage: sessionStorage,
            customParams: {},
            eagerLoadAuthWellKnownEndpoints: true,
            disableRefreshIdTokenAuthTimeValidation: false,
            tokenRefreshInSeconds: 3,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        configurationProvider.setConfig(config);

        expect(configurationProvider.openIDConfiguration).toEqual(expected);
    });

    it('setup calls setSpecialCases', () => {
        const config = {
            stsServer: 'stsServer',
            startCheckSession: true,
            silentRenew: true,
            useRefreshToken: false,
        };

        const spy = spyOn(configurationProvider as any, 'setSpecialCases');

        configurationProvider.setConfig(config);

        expect(spy).toHaveBeenCalled();
    });

    it('silent_renew and start_checksession can be set to true when using the browser platform', () => {
        const config: OpenIdConfiguration = {
            silentRenew: true,
            stsServer: '',
            startCheckSession: true,
            useRefreshToken: false,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(true);

        configurationProvider.setConfig(config);

        expect(configurationProvider.openIDConfiguration.silentRenew).toEqual(true);
        expect(configurationProvider.openIDConfiguration.startCheckSession).toEqual(true);
    });

    it('silent_renew and start_checksession are always false when not using the browser platform', () => {
        const config: OpenIdConfiguration = {
            silentRenew: true,
            stsServer: '',
            startCheckSession: true,
            useRefreshToken: false,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        configurationProvider.setConfig(config);

        expect(configurationProvider.openIDConfiguration.silentRenew).toEqual(false);
        expect(configurationProvider.openIDConfiguration.startCheckSession).toEqual(false);
    });

    it('public config has default config if config is not getting passed', () => {
        configurationProvider.setConfig(null);

        const currentConfig = configurationProvider.openIDConfiguration;

        expect(currentConfig).not.toBeNull();
        expect(currentConfig).toEqual(DEFAULT_CONFIG);
    });

    it('wirtes warning if storage is being passed', () => {
        const config: OpenIdConfiguration = {
            storage: 'anything',
        };

        const spy = spyOn(console, 'warn');

        configurationProvider.setConfig(config);

        expect(spy).toHaveBeenCalled();
    });
});
