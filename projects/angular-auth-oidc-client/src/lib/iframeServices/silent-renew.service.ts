import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_SILENT_RENEW_IDENTIFIER = 'myiFrameForSilentRenew';

@Injectable()
export class SilentRenewService {
    constructor(private configurationProvider: ConfigurationProvider, private iFrameService: IFrameService) {}

    getOrCreateIframe(): HTMLIFrameElement {
        const existingIframe = this.getExistingIframe();

        if (!existingIframe) {
            return this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);
        }

        return existingIframe;
    }

    silentRenewShouldBeUsed() {
        return (
            !this.configurationProvider.openIDConfiguration.useRefreshToken && this.configurationProvider.openIDConfiguration.silentRenew
        );
    }

    private getExistingIframe() {
        return this.iFrameService.getExistingIFrame(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);
    }
}
