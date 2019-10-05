import { Injectable } from '@angular/core';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class IFrameService {
    constructor(private loggerService: LoggerService) {}

    getExistingIFrame(identifier: string): HTMLIFrameElement | null {
        const iFrameOnParent = this.getIFrameFromParentWindow(identifier);
        if (this.isIFrameElement(iFrameOnParent)) {
            return iFrameOnParent;
        }
        const iFrameOnSelf = this.getIFrameFromWindow(identifier);
        if (this.isIFrameElement(iFrameOnSelf)) {
            return iFrameOnSelf;
        }
        return null;
    }

    addIFrameToWindowBody(identifier: string): HTMLIFrameElement {
        const sessionIframe = window.document.createElement('iframe');
        sessionIframe.id = identifier;
        this.loggerService.logDebug(sessionIframe);
        sessionIframe.style.display = 'none';
        window.document.body.appendChild(sessionIframe);
        return sessionIframe;
    }

    private getIFrameFromParentWindow(identifier: string): HTMLIFrameElement | null {
        try {
            const iFrameElement = window.parent.document.getElementById(identifier);
            if (this.isIFrameElement(iFrameElement)) {
                return iFrameElement;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    private getIFrameFromWindow(identifier: string): HTMLIFrameElement | null {
        const iFrameElement = window.document.getElementById(identifier);
        if (this.isIFrameElement(iFrameElement)) {
            return iFrameElement;
        }
        return null;
    }

    private isIFrameElement(element: HTMLElement | null): element is HTMLIFrameElement {
        return !!element && element instanceof HTMLIFrameElement;
    }
}
