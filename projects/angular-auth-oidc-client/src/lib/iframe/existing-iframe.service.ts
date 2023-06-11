import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';

@Injectable({ providedIn: 'root' })
export class IFrameService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly loggerService: LoggerService
  ) {}

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

  addIFrameToWindowBody(
    identifier: string,
    config: OpenIdConfiguration
  ): HTMLIFrameElement {
    const sessionIframe = this.document.createElement('iframe');

    sessionIframe.id = identifier;
    sessionIframe.title = identifier;
    this.loggerService.logDebug(config, sessionIframe);
    sessionIframe.style.display = 'none';
    this.document.body.appendChild(sessionIframe);

    return sessionIframe;
  }

  private getIFrameFromParentWindow(
    identifier: string
  ): HTMLIFrameElement | null {
    try {
      const iFrameElement =
        this.document.defaultView.parent.document.getElementById(identifier);

      if (this.isIFrameElement(iFrameElement)) {
        return iFrameElement;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  private getIFrameFromWindow(identifier: string): HTMLIFrameElement | null {
    const iFrameElement = this.document.getElementById(identifier);

    if (this.isIFrameElement(iFrameElement)) {
      return iFrameElement;
    }

    return null;
  }

  private isIFrameElement(
    element: HTMLElement | null
  ): element is HTMLIFrameElement {
    return !!element && element instanceof HTMLIFrameElement;
  }
}
