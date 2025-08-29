
import { inject, Injectable, RendererFactory2, DOCUMENT } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { UrlService } from '../utils/url/url.service';
import { SilentRenewService, getFrameId } from './silent-renew.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionIframeService {
  private readonly renderer = inject(RendererFactory2).createRenderer(
    null,
    null
  );
  private readonly loggerService = inject(LoggerService);
  private readonly urlService = inject(UrlService);
  private readonly silentRenewService = inject(SilentRenewService);
  private readonly document = inject(DOCUMENT);

  refreshSessionWithIframe(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<boolean> {
    this.loggerService.logDebug(
      config,
      'BEGIN refresh session Authorize Iframe renew'
    );

    return this.urlService
      .getRefreshSessionSilentRenewUrl(config, customParams)
      .pipe(
        switchMap((url) => {
          return this.sendAuthorizeRequestUsingSilentRenew(
            url,
            config,
            allConfigs
          );
        })
      );
  }

  private sendAuthorizeRequestUsingSilentRenew(
    url: string | null,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<boolean> {
    const sessionIframe = this.silentRenewService.getOrCreateIframe(config);

    this.initSilentRenewRequest(config, allConfigs);
    this.loggerService.logDebug(
      config,
      `sendAuthorizeRequestUsingSilentRenew for URL: ${url}`
    );

    return new Observable((observer) => {
      const onLoadHandler = (): void => {
        sessionIframe.removeEventListener('load', onLoadHandler);
        this.loggerService.logDebug(
          config,
          'removed event listener from IFrame'
        );
        observer.next(true);
        observer.complete();
      };

      sessionIframe.addEventListener('load', onLoadHandler);
      sessionIframe.contentWindow?.location.replace(url ?? '');
    });
  }

  private initSilentRenewRequest(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): void {
    const instanceId = Math.random();

    this.loggerService.logDebug(
      config,
      `Creating new silent renew handlers for config: ${config.configId}, instance: ${instanceId}`
    );

    const initDestroyHandler = this.renderer.listen(
      'window',
      'oidc-silent-renew-init',
      (e: CustomEvent) => {
        const eventData = e.detail;

        if (eventData.configId === config.configId && eventData.instanceId !== instanceId) {
          this.loggerService.logDebug(
            config,
            `Destroying old handlers for config: ${config.configId} (old instance: ${instanceId}, new instance: ${eventData.instanceId})`
          );
          initDestroyHandler();
          renewDestroyHandler();
        }
      }
    );
    const renewDestroyHandler = this.renderer.listen(
      'window',
      'oidc-silent-renew-message',
      (e: CustomEvent) => {

        if (this.shouldProcessRenewMessage(e, config)) {
          const eventToPass = this.convertToLegacyEvent(e);

          this.silentRenewService.silentRenewEventHandler(eventToPass, config, allConfigs);
        }
      }
    );


    this.document.defaultView?.dispatchEvent(
      new CustomEvent('oidc-silent-renew-init', {
        detail: {
          instanceId,
          configId: config.configId
        }
      })
    );
  }

  private shouldProcessRenewMessage(
    e: CustomEvent,
    config: OpenIdConfiguration
  ): boolean {

    if (!e?.detail) {
      this.loggerService.logDebug(
        config,
        `Silent renew event has no valid payload: ${e?.detail}`
      );

      return false;
    }

    if (e.detail.srcFrameId) {
      const shouldProcess = getFrameId(config.configId) === e.detail.srcFrameId;

      this.loggerService.logDebug(
        config,
        `Silent renew event from frame: ${e.detail.srcFrameId}, current configId: ${config.configId}, processing: ${shouldProcess}`
      );

      return shouldProcess;
    }

    // Fallback for backward compatibility - if no srcFrameId but has detail (legacy format)
    this.loggerService.logDebug(
      config,
      'Silent renew event without srcFrameId - processing for backward compatibility'
    );

    return true;
  }

  private convertToLegacyEvent(e: CustomEvent): CustomEvent {
    // If event has the new format with url property, convert it to legacy format
    if (e?.detail?.url) {
      return new CustomEvent(e.type, { detail: e.detail.url });
    }

    // Otherwise, return as-is (already in legacy format)
    return e;
  }

}
