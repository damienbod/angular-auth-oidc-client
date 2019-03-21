import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { IFrameService } from './existing-iframe.service';
import { LoggerService } from './oidc.logger.service';

const IFRAME_FOR_SILENT_RENEW_IDENTIFIER = 'myiFrameForSilentRenew';

@Injectable()
export class OidcSecuritySilentRenew {
    private sessionIframe: any;
    private isRenewInitialized = false;

    constructor(private loggerService: LoggerService, private iFrameService: IFrameService) {}

    initRenew() {
        const existingIFrame = this.iFrameService.getExistingIFrame(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);

        if (!existingIFrame) {
            this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);
        }

        this.isRenewInitialized = true;
    }

    startRenew(url: string): Observable<any> {
        if (!this.isRenewInitialized) {
            this.initRenew();
        }

        this.sessionIframe = this.iFrameService.getExistingIFrame(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);

        this.loggerService.logDebug('startRenew for URL:' + url);
        this.sessionIframe.contentWindow.location.replace(url);

        return Observable.create((observer: Observer<any>) => {
            this.sessionIframe.onload = () => {
                observer.next(this);
                observer.complete();
            };
        });
    }
}
