import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../models/auth.configuration';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { PlatformProvider } from '../services/platform.provider';

@Injectable({ providedIn: 'root' })
export class ConfigurationProvider {
    private DEFAULT_CONFIG: OpenIdConfiguration = {
        stsServer: 'https://please_set',
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
        storage: typeof Storage !== 'undefined' ? sessionStorage : null,
    };

    private wellKnownEndpointsInternal: AuthWellKnownEndpoints;
    private openIdConfigurationInternal: OpenIdConfiguration;

    get openIDConfiguration(): OpenIdConfiguration {
        return this.openIdConfigurationInternal || null;
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
