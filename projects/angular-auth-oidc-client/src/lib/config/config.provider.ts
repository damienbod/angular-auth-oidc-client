import { Injectable } from '@angular/core';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable({ providedIn: 'root' })
export class ConfigurationProvider {
    private wellKnownEndpointsInternal: AuthWellKnownEndpoints;
    private openIdConfigurationInternal: OpenIdConfiguration;

    get openIDConfiguration(): OpenIdConfiguration {
        if (!this.openIdConfigurationInternal) {
            // 'Config was asked before the module was set, this should never happen'
            return null;
        }

        return this.openIdConfigurationInternal;
    }

    get wellKnownEndpoints(): AuthWellKnownEndpoints {
        if (!this.wellKnownEndpointsInternal) {
            // 'Config was asked before the module was set, this should never happen'
            return null;
        }

        return this.wellKnownEndpointsInternal;
    }

    public get configuration() {
        // TODO CHECK IF MODULE IS SET UP HERE,
        // IF NOT, RETURN NULL AND LOG AN INFO
        /// THIS HAS TO BE PART OF A PUBLIC FACADE
        // MAYBE INTRODUCED IN THE FUTURE

        return {
            config: { ...this.openIDConfiguration },
            wellknown: { ...this.wellKnownEndpoints },
        };
    }

    hasValidConfig() {
        return !!this.wellKnownEndpointsInternal && this.openIdConfigurationInternal;
    }

    constructor(private platformProvider: PlatformProvider) {}

    setConfig(configuration: OpenIdConfiguration, wellKnownEndpoints: AuthWellKnownEndpoints) {
        this.wellKnownEndpointsInternal = wellKnownEndpoints;
        this.openIdConfigurationInternal = { ...DEFAULT_CONFIG, ...configuration };
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
