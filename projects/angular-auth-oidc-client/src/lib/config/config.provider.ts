import { Injectable } from '@angular/core';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { AuthWellKnownEndpoints } from './auth-well-known-endpoints';
import { DEFAULT_CONFIG } from './default-config';
import { OpenIdConfiguration } from './openid-configuration';
import { PublicConfiguration } from './public-configuration';

@Injectable()
export class ConfigurationProvider {
    private wellKnownEndpointsInternal: AuthWellKnownEndpoints;
    private openIdConfigurationInternal: OpenIdConfiguration;

    get openIDConfiguration(): OpenIdConfiguration {
        if (!this.openIdConfigurationInternal) {
            return null;
        }

        return this.openIdConfigurationInternal;
    }

    get wellKnownEndpoints(): AuthWellKnownEndpoints {
        if (!this.wellKnownEndpointsInternal) {
            return null;
        }

        return this.wellKnownEndpointsInternal;
    }

    get configuration(): PublicConfiguration {
        if (!this.hasValidConfig()) {
            return null;
        }

        return {
            configuration: { ...this.openIDConfiguration },
            wellknown: { ...this.wellKnownEndpoints },
        };
    }

    hasValidConfig() {
        return !!this.wellKnownEndpointsInternal && !!this.openIdConfigurationInternal;
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
