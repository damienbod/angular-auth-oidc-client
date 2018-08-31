import { EventEmitter, Injectable, Output } from '@angular/core';
import { XhrDataService } from '../data-services/xhr-data.service';

@Injectable()
export class OidcConfigService {
    @Output()
    onConfigurationLoaded = new EventEmitter<boolean>();
    clientConfiguration: any;
    wellKnownEndpoints: any;

    constructor(private readonly xhrDataService: XhrDataService) {}

    async load(configUrl: string) {
        try {
            const response = await this.xhrDataService.loadConfiguration(configUrl);
            this.clientConfiguration = response.json();
            await this.load_using_stsServer(this.clientConfiguration.stsServer);

            if (!response.ok) {
                throw new Error(response.statusText);
            }
        } catch (err) {
            console.error(`OidcConfigService 'load' threw an error on calling ${configUrl}`, err);
            this.onConfigurationLoaded.emit(false);
        }
    }

    async load_using_stsServer(stsServer: string) {
        try {
            const url = `${stsServer}/.well-known/openid-configuration`;
            const response = await this.xhrDataService.loadConfiguration(url);

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            this.wellKnownEndpoints = response.json();
            this.onConfigurationLoaded.emit(true);
        } catch (err) {
            console.error(
                `OidcConfigService 'load_using_stsServer' threw an error on calling ${stsServer}`,
                err
            );
            this.onConfigurationLoaded.emit(false);
        }
    }

    async load_using_custom_stsServer(url: string) {
        try {
            const response = await this.xhrDataService.loadConfiguration(url);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            this.wellKnownEndpoints = await response.json();
            this.onConfigurationLoaded.emit(true);
        } catch (err) {
            console.error(
                `OidcConfigService 'load_using_custom_stsServer' threw an error on calling ${url}`,
                err
            );
            this.onConfigurationLoaded.emit(false);
        }
    }
}
