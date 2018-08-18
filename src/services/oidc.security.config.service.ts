import { EventEmitter, Injectable, Output } from '@angular/core';

@Injectable()
export class OidcConfigService {
    @Output()
    onConfigurationLoaded = new EventEmitter<boolean>();
    clientConfiguration: any;
    wellKnownEndpoints: any;

    async load(configUrl: string) {
        try {
            const response = await fetch(configUrl);
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            this.clientConfiguration = await response.json();
            await this.load_using_stsServer(this.clientConfiguration.stsServer);
        } catch (err) {
            console.error(
                `OidcConfigService 'load' threw an error on calling ${configUrl}`,
                err
            );
            this.onConfigurationLoaded.emit(false);
        }
    }

    async load_using_stsServer(stsServer: string) {
        try {
            const response = await fetch(
                `${stsServer}/.well-known/openid-configuration`
            );
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            this.wellKnownEndpoints = await response.json();
            this.onConfigurationLoaded.emit(true);
        } catch (err) {
            console.error(
                `OidcConfigService 'load_using_stsServer' threw an error on calling ${stsServer}`,
                err
            );
            this.onConfigurationLoaded.emit(false);
        }
    }

    async load_using_custom_stsServer(stsServer: string) {
        try {
            const response = await fetch(stsServer);

            if (!response.ok) {
                throw new Error(response.statusText);
            }
            this.wellKnownEndpoints = await response.json();
            this.onConfigurationLoaded.emit(true);
        } catch (err) {
            console.error(
                `OidcConfigService 'load_using_custom_stsServer' threw an error on calling ${stsServer}`,
                err
            );
            this.onConfigurationLoaded.emit(false);
        }
    }
}
