import { TestBed } from '@angular/core/testing';
import { PlatformProvider } from '../services/platform.provider';
import { ConfigurationProvider } from './config.provider';
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
        configurationProvider.setConfig({ stsServer: 'hello' }, null);

        expect(configurationProvider.openIDConfiguration).toBeDefined();
    });

    it('setup defines authwellknownendpoints', () => {
        const toPass = {
            issuer: '',
            jwks_uri: '',
            authorization_endpoint: '',
            token_endpoint: '',
            userinfo_endpoint: '',
            end_session_endpoint: '',
            check_session_iframe: '',
            revocation_endpoint: '',
            introspection_endpoint: '',
        };

        const expected = { ...toPass };

        configurationProvider.setConfig(null, toPass);

        expect(configurationProvider.wellKnownEndpoints).toEqual(expected);
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
            silentRenewOffsetInSeconds: 0,
            useRefreshToken: false,
            ignoreNonceAfterRefresh: false,
            postLoginRoute: '/',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            autoUserinfo: true,
            autoCleanStateAfterAuthentication: true,
            triggerAuthorizationResultEvent: false,
            logConsoleWarningActive: true,
            logConsoleDebugActive: false,
            issValidationOff: false,
            historyCleanupOff: false,
            maxIdTokenIatOffsetAllowedInSeconds: 3,
            isauthorizedRaceTimeoutInSeconds: 5,
            disableIatOffsetValidation: false,
            storage: sessionStorage,
            customParams: {},
        };

        configurationProvider.setConfig({ stsServer: 'https://please_set' }, null);

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
            silentRenewOffsetInSeconds: 0,
            useRefreshToken: false,
            ignoreNonceAfterRefresh: false,
            postLoginRoute: '/',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            autoUserinfo: true,
            autoCleanStateAfterAuthentication: true,
            triggerAuthorizationResultEvent: false,
            logConsoleWarningActive: true,
            logConsoleDebugActive: false,
            issValidationOff: false,
            historyCleanupOff: false,
            maxIdTokenIatOffsetAllowedInSeconds: 3,
            isauthorizedRaceTimeoutInSeconds: 5,
            disableIatOffsetValidation: false,
            storage: sessionStorage,
            customParams: {},
        };

        configurationProvider.setConfig(config, null);

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
            silentRenewOffsetInSeconds: 0,
            useRefreshToken: false,
            ignoreNonceAfterRefresh: false,
            postLoginRoute: '/',
            forbiddenRoute: '/forbidden',
            unauthorizedRoute: '/unauthorized',
            autoUserinfo: true,
            autoCleanStateAfterAuthentication: true,
            triggerAuthorizationResultEvent: false,
            logConsoleWarningActive: true,
            logConsoleDebugActive: false,
            issValidationOff: false,
            historyCleanupOff: false,
            maxIdTokenIatOffsetAllowedInSeconds: 3,
            isauthorizedRaceTimeoutInSeconds: 5,
            disableIatOffsetValidation: false,
            storage: sessionStorage,
            customParams: {},
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        configurationProvider.setConfig(config, null);

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

        configurationProvider.setConfig(config, null);

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

        configurationProvider.setConfig(config, null);

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

        configurationProvider.setConfig(config, null);

        expect(configurationProvider.openIDConfiguration.silentRenew).toEqual(false);
        expect(configurationProvider.openIDConfiguration.startCheckSession).toEqual(false);
    });
});
