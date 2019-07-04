import { Injectable } from '@angular/core';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class IFrameService {
    constructor(private loggerService: LoggerService) {}

    getExistingIFrame(identifier: string) {
        const iFrameOnParent = this.getIFrameFromParentWindow(identifier);

        if (iFrameOnParent) {
            return iFrameOnParent;
        }

        return this.getIFrameFromWindow(identifier);
    }

    addIFrameToWindowBody(identifier: string) {
        const sessionIframe = window.document.createElement('iframe');
        sessionIframe.id = identifier;
        this.loggerService.logDebug(sessionIframe);
        sessionIframe.style.display = 'none';
        window.document.body.appendChild(sessionIframe);
        return sessionIframe;
    }

    private getIFrameFromParentWindow(identifier: string) {
        try {
            return window.parent.document.getElementById(identifier);
        } catch (e) {
            return null;
        }
    }

    private getIFrameFromWindow(identifier: string) {
        return window.document.getElementById(identifier);
    }
}
