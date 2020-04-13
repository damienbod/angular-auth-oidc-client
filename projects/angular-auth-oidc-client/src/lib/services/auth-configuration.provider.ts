import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { OpenIdConfiguration } from '../models/auth.configuration';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { PlatformProvider } from './platform.provider';

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

    private INITIAL_AUTHWELLKNOWN: AuthWellKnownEndpoints = {
        issuer: '',
        jwksUri: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userinfoEndpoint: '',
        endSessionEndpoint: '',
        checkSessionIframe: '',
        revocationEndpoint: '',
        introspectionEndpoint: '',
    };

    private mergedOpenIdConfiguration: OpenIdConfiguration = this.DEFAULT_CONFIG;
    private authWellKnownEndpoints: AuthWellKnownEndpoints = this.INITIAL_AUTHWELLKNOWN;

    private onConfigurationChangeInternal = new Subject<OpenIdConfiguration>();

    get openIDConfiguration(): OpenIdConfiguration {
        return this.mergedOpenIdConfiguration;
    }

    get wellKnownEndpoints(): AuthWellKnownEndpoints {
        return this.authWellKnownEndpoints;
    }

    get onConfigurationChange() {
        return this.onConfigurationChangeInternal.asObservable();
    }

    constructor(private platformProvider: PlatformProvider) {}

    setup(
        passedOpenIfConfiguration: OpenIdConfiguration | null | undefined,
        passedAuthWellKnownEndpoints: AuthWellKnownEndpoints | null | undefined
    ) {
        this.mergedOpenIdConfiguration = { ...this.mergedOpenIdConfiguration, ...passedOpenIfConfiguration };
        this.setSpecialCases(this.mergedOpenIdConfiguration);
        this.authWellKnownEndpoints = { ...passedAuthWellKnownEndpoints };
        this.onConfigurationChangeInternal.next({ ...this.mergedOpenIdConfiguration });
    }

    private setSpecialCases(currentConfig: OpenIdConfiguration) {
        if (!this.platformProvider.isBrowser) {
            currentConfig.startCheckSession = false;
            currentConfig.silentRenew = false;
            currentConfig.useRefreshToken = false;
        }
    }
}
