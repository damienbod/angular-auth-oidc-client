import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class IFrameService {
    constructor(
        private loggerService: LoggerService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {}

    getExistingIFrame(identifier: string) {
        const iFrameOnParent = this.getIFrameFromParentWindow(identifier);

        if (iFrameOnParent) {
            return iFrameOnParent;
        }

        return this.getIFrameFromWindow(identifier);
    }

    addIFrameToWindowBody(identifier: string) {
        if(isPlatformBrowser(platformId)) {
            const sessionIframe = window.document.createElement('iframe');
            sessionIframe.id = identifier;
            this.loggerService.logDebug(sessionIframe);
            sessionIframe.style.display = 'none';
            window.document.body.appendChild(sessionIframe);
            return sessionIframe;
        }
        return null;
    }

    private getIFrameFromParentWindow(identifier: string) {
        if(isPlatformBrowser(platformId)) {
            return window.parent.document.getElementById(identifier);
        }
        return null;
    }

    private getIFrameFromWindow(identifier: string) {
        if(isPlatformBrowser(platformId)) {
            return window.document.getElementById(identifier);
        }
        return null;
    }
}
