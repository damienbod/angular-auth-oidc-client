import { Injectable } from '@angular/core';
import { LogLevel } from '../logging/log-level';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable({ providedIn: 'root' })
export class ConfigurationProvider {
    private DEFAULT_CONFIG: OpenIdConfiguration = {
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
        logLevel: LogLevel.Warn,
        issValidationOff: false,
        historyCleanupOff: false,
        maxIdTokenIatOffsetAllowedInSeconds: 3,
        isauthorizedRaceTimeoutInSeconds: 5,
        disableIatOffsetValidation: false,
        storage: typeof Storage !== 'undefined' ? sessionStorage : null,
        customParams: {},
    };

    private wellKnownEndpointsInternal: AuthWellKnownEndpoints;
    private openIdConfigurationInternal: OpenIdConfiguration;

    get openIDConfiguration(): OpenIdConfiguration {
        return this.openIdConfigurationInternal || this.DEFAULT_CONFIG;
    }

    get wellKnownEndpoints(): AuthWellKnownEndpoints {
        return this.wellKnownEndpointsInternal || null;
    }

    hasValidConfig() {
        return !!this.wellKnownEndpointsInternal && this.openIdConfigurationInternal;
    }

    constructor(private platformProvider: PlatformProvider) {}

    setConfig(configuration: OpenIdConfiguration, wellKnownEndpoints: AuthWellKnownEndpoints) {
        this.wellKnownEndpointsInternal = wellKnownEndpoints;
        this.openIdConfigurationInternal = { ...this.DEFAULT_CONFIG, ...configuration };
        this.setSpecialCases(this.openIdConfigurationInternal);
    }

    private setSpecialCases(currentConfig: OpenIdConfiguration) {
        if (!this.platformProvider.isBrowser) {
            currentConfig.startCheckSession = false;
            currentConfig.silentRenew = false;
            currentConfig.useRefreshToken = false;
        }
    }
}
