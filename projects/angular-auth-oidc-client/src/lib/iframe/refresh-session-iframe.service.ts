import { inject, Injectable, RendererFactory2, DOCUMENT } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/services/logger.service';
import { UrlService } from '../utils/url/url.service';
import { SilentRenewService, getFrameId } from './silent-renew.service';

const SILENT_RENEW_INIT_EVENT = 'oidc-silent-renew-init';
const SILENT_RENEW_MESSAGE_EVENT = 'oidc-silent-renew-message';

interface SilentRenewInstance {
  instanceId: number;
  configId?: string;
}

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
        switchMap((url) =>
          this.sendAuthorizeRequestUsingSilentRenew(url, config, allConfigs)
        )
      );
  }

  private sendAuthorizeRequestUsingSilentRenew(
    url: string | null,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<boolean> {
    const sessionIframe = this.silentRenewService.getOrCreateIframe(config);

    this.listenForSilentRenewMessages(config, allConfigs);
    this.loggerService.logDebug(
      config,
      `sendAuthorizeRequestUsingSilentRenew for URL: ${url}`
    );

    return this.navigateAndWaitUntilLoaded(sessionIframe, url, config);
  }

  private navigateAndWaitUntilLoaded(
    iframe: HTMLIFrameElement,
    url: string | null,
    config: OpenIdConfiguration
  ): Observable<boolean> {
    return new Observable((observer) => {
      const onLoad = (): void => {
        iframe.removeEventListener('load', onLoad);
        this.loggerService.logDebug(
          config,
          'removed event listener from IFrame'
        );
        observer.next(true);
        observer.complete();
      };

      iframe.addEventListener('load', onLoad);
      iframe.contentWindow?.location.replace(url ?? '');
    });
  }

  private listenForSilentRenewMessages(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): void {
    const instanceId = Math.random();

    this.loggerService.logDebug(
      config,
      `Creating new silent renew handlers for config: ${config.configId}, instance: ${instanceId}`
    );

    const stopHandlingRenewMessages = this.handleRenewMessages(
      config,
      allConfigs
    );

    this.stopWhenNewerInstanceStarts(
      instanceId,
      config,
      stopHandlingRenewMessages
    );
    this.announceInstance(instanceId, config);
  }

  private handleRenewMessages(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): () => void {
    return this.renderer.listen(
      'window',
      SILENT_RENEW_MESSAGE_EVENT,
      (e: CustomEvent) => {
        if (this.shouldProcessRenewMessage(e, config)) {
          this.silentRenewService.silentRenewEventHandler(
            this.convertToLegacyEvent(e),
            config,
            allConfigs
          );
        }
      }
    );
  }

  private stopWhenNewerInstanceStarts(
    instanceId: number,
    config: OpenIdConfiguration,
    stopHandlingRenewMessages: () => void
  ): void {
    const stopWatchingForNewerInstances = this.renderer.listen(
      'window',
      SILENT_RENEW_INIT_EVENT,
      (e: CustomEvent<SilentRenewInstance>) => {
        const newInstance = e.detail;

        if (
          !this.isNewerInstanceOfSameConfig(newInstance, instanceId, config)
        ) {
          return;
        }

        this.loggerService.logDebug(
          config,
          `Destroying old handlers for config: ${config.configId} (old instance: ${instanceId}, new instance: ${newInstance.instanceId})`
        );
        stopWatchingForNewerInstances();
        stopHandlingRenewMessages();
      }
    );
  }

  private isNewerInstanceOfSameConfig(
    newInstance: SilentRenewInstance,
    instanceId: number,
    config: OpenIdConfiguration
  ): boolean {
    return (
      newInstance.configId === config.configId &&
      newInstance.instanceId !== instanceId
    );
  }

  private announceInstance(
    instanceId: number,
    config: OpenIdConfiguration
  ): void {
    const instance: SilentRenewInstance = {
      instanceId,
      configId: config.configId,
    };

    this.document.defaultView?.dispatchEvent(
      new CustomEvent(SILENT_RENEW_INIT_EVENT, { detail: instance })
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
      return this.isMessageFromOwnIframe(e.detail.srcFrameId, config);
    }

    this.loggerService.logDebug(
      config,
      'Silent renew event without srcFrameId - processing for backward compatibility'
    );

    return true;
  }

  private isMessageFromOwnIframe(
    srcFrameId: string,
    config: OpenIdConfiguration
  ): boolean {
    const isOwnIframe = getFrameId(config.configId) === srcFrameId;

    this.loggerService.logDebug(
      config,
      `Silent renew event from frame: ${srcFrameId}, current configId: ${config.configId}, processing: ${isOwnIframe}`
    );

    return isOwnIframe;
  }

  private convertToLegacyEvent(e: CustomEvent): CustomEvent {
    if (e?.detail?.url) {
      return new CustomEvent(e.type, { detail: e.detail.url });
    }

    return e;
  }
}
