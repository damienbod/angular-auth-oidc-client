import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { UrlService } from '../utils/url/url.service';
import { SilentRenewService } from './silent-renew.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionIframeService {
  private renderer: Renderer2;

  constructor(
    @Inject(DOCUMENT) private readonly doc: any,
    private loggerService: LoggerService,
    private urlService: UrlService,
    private silentRenewService: SilentRenewService,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  refreshSessionWithIframe(configId: string, customParams?: { [key: string]: string | number | boolean }): Observable<boolean> {
    this.loggerService.logDebug(configId, 'BEGIN refresh session Authorize Iframe renew');
    const urlPromise = this.urlService.getRefreshSessionSilentRenewUrl(configId, customParams);

    return from(urlPromise).pipe(
      switchMap((url) => {
        return this.sendAuthorizeRequestUsingSilentRenew(url, configId);
      })
    );
  }

  private sendAuthorizeRequestUsingSilentRenew(url: string, configId: string): Observable<boolean> {
    const sessionIframe = this.silentRenewService.getOrCreateIframe(configId);
    this.initSilentRenewRequest(configId);
    this.loggerService.logDebug(configId, 'sendAuthorizeRequestUsingSilentRenew for URL:' + url);

    return new Observable((observer) => {
      const onLoadHandler = (): void => {
        sessionIframe.removeEventListener('load', onLoadHandler);
        this.loggerService.logDebug(configId, 'removed event listener from IFrame');
        observer.next(true);
        observer.complete();
      };
      sessionIframe.addEventListener('load', onLoadHandler);
      sessionIframe.contentWindow.location.replace(url);
    });
  }

  private initSilentRenewRequest(configId: string): void {
    const instanceId = Math.random();

    const initDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-init', (e: CustomEvent) => {
      if (e.detail !== instanceId) {
        initDestroyHandler();
        renewDestroyHandler();
      }
    });
    const renewDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-message', (e) =>
      this.silentRenewService.silentRenewEventHandler(e, configId)
    );

    this.doc.defaultView.dispatchEvent(
      new CustomEvent('oidc-silent-renew-init', {
        detail: instanceId,
      })
    );
  }
}
