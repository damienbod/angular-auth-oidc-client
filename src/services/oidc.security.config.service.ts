import { Injectable, EventEmitter, Output } from '@angular/core';

@Injectable()
export class OidcConfigService {
    @Output() onConfigurationLoaded = new EventEmitter<boolean>();
    clientConfiguration: any;
    wellKnownEndpoints: any;

    constructor() {}

    async load(configUrl: string) {
        const response = await fetch(configUrl);
        this.clientConfiguration = await response.json()
        await this.loadstsServer(this.clientConfiguration.stsServer);
    }

    async loadstsServer(stsServer: string) {
        const response = await fetch(`${stsServer}/.well-known/openid-configuration`);
        this.wellKnownEndpoints = await response.json()
        this.onConfigurationLoaded.emit();
    }
}
