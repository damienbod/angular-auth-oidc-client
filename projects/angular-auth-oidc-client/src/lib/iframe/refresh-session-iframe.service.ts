import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggerService } from '../logging/logger.service';
import { UrlService } from '../utils/url/url.service';
import { SilentRenewService } from './silent-renew.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionIframeService {
    private renderer: Renderer2;

    constructor(
        private loggerService: LoggerService,
        private urlService: UrlService,
        private silentRenewService: SilentRenewService,
        rendererFactory: RendererFactory2
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    refreshSessionWithIframe(): Observable<boolean> {
        this.loggerService.logDebug('BEGIN refresh session Authorize Iframe renew');
        const url = this.urlService.getRefreshSessionSilentRenewUrl();
        return this.sendAuthorizeReqestUsingSilentRenew(url);
    }

    private sendAuthorizeReqestUsingSilentRenew(url: string): Observable<boolean> {
        const sessionIframe = this.silentRenewService.getOrCreateIframe();
        this.initSilentRenewRequest();
        this.loggerService.logDebug('sendAuthorizeReqestUsingSilentRenew for URL:' + url);

        return new Observable((observer) => {
            const onLoadHandler = () => {
                sessionIframe.removeEventListener('load', onLoadHandler);
                this.loggerService.logDebug('removed event listener from IFrame');
                observer.next(true);
                observer.complete();
            };
            sessionIframe.addEventListener('load', onLoadHandler);
            sessionIframe.contentWindow.location.replace(url);
        });
    }

    private initSilentRenewRequest() {
        const instanceId = Math.random();

        const initDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-init', (e: CustomEvent) => {
            if (e.detail !== instanceId) {
                initDestroyHandler();
                renewDestroyHandler();
            }
        });
        const renewDestroyHandler = this.renderer.listen('window', 'oidc-silent-renew-message', (e) =>
            this.silentRenewService.silentRenewEventHandler(e)
        );

        window.dispatchEvent(
            new CustomEvent('oidc-silent-renew-init', {
                detail: instanceId,
            })
        );
    }
}
