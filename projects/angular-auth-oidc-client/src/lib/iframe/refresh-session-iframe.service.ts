import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { UrlService } from '../utils/url/url.service';
import { SilentRenewService } from './silent-renew.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionIframeService {
  private readonly renderer: Renderer2;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly loggerService: LoggerService,
    private readonly urlService: UrlService,
    private readonly silentRenewService: SilentRenewService,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  refreshSessionWithIframe(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<boolean> {
    this.loggerService.logDebug(config, 'BEGIN refresh session Authorize Iframe renew');

    return this.urlService.getRefreshSessionSilentRenewUrl(config, customParams).pipe(
      switchMap((url) => {
        return this.sendAuthorizeRequestUsingSilentRenew(url, config, allConfigs);
      })
    );
  }

  private sendAuthorizeRequestUsingSilentRenew(
    url: string,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<boolean> {
    const sessionIframe = this.silentRenewService.getOrCreateIframe(config);

    this.initSilentRenewRequest(config, allConfigs);
    this.loggerService.logDebug(config, 'sendAuthorizeRequestUsingSilentRenew for URL:' + url);

    return new Observable((observer) => {
      const onLoadHandler = (): void => {
        sessionIframe.removeEventListener('load', onLoadHandler);
        this.loggerService.logDebug(config, 'removed event listener from IFrame');
        observer.next(true);
        observer.complete();
      };

      sessionIframe.addEventListener('load', onLoadHandler);
      sessionIframe.contentWindow.location.replace(url);
    });
  }

  private initSilentRenewRequest(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    const instanceId = Math.random();

    const initDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-init', (e: CustomEvent) => {
      if (e.detail !== instanceId) {
        initDestroyHandler();
        renewDestroyHandler();
      }
    });
    const renewDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-message', (e) =>
      this.silentRenewService.silentRenewEventHandler(e, config, allConfigs)
    );

    this.document.defaultView.dispatchEvent(
      new CustomEvent('oidc-silent-renew-init', {
        detail: instanceId,
      })
    );
  }
}
