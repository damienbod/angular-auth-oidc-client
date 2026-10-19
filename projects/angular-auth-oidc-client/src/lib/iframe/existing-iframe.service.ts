import { inject, Injectable, DOCUMENT } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/services/logger.service';

@Injectable({ providedIn: 'root' })
export class IFrameService {
  private readonly document = inject(DOCUMENT);
  private readonly loggerService = inject(LoggerService);

  getExistingIFrame(identifier: string): HTMLIFrameElement | null {
    return (
      this.getIFrameFromParentWindow(identifier) ??
      this.getIFrameFromWindow(identifier)
    );
  }

  addIFrameToWindowBody(
    identifier: string,
    config: OpenIdConfiguration
  ): HTMLIFrameElement {
    const sessionIframe = this.createHiddenIFrame(identifier);

    this.loggerService.logDebug(config, sessionIframe);
    this.document.body.appendChild(sessionIframe);

    return sessionIframe;
  }

  private createHiddenIFrame(identifier: string): HTMLIFrameElement {
    const iframe = this.document.createElement('iframe');

    iframe.id = identifier;
    iframe.title = identifier;
    iframe.style.display = 'none';

    return iframe;
  }

  private getIFrameFromParentWindow(
    identifier: string
  ): HTMLIFrameElement | null {
    try {
      const parentDocument = this.document.defaultView?.parent.document;

      return this.asIFrameOrNull(parentDocument?.getElementById(identifier));
    } catch (_e) {
      return null;
    }
  }

  private getIFrameFromWindow(identifier: string): HTMLIFrameElement | null {
    return this.asIFrameOrNull(this.document.getElementById(identifier));
  }

  private asIFrameOrNull(
    element: HTMLElement | null | undefined
  ): HTMLIFrameElement | null {
    return element instanceof HTMLIFrameElement ? element : null;
  }
}
