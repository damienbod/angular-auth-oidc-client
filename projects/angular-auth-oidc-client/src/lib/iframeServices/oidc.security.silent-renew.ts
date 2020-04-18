import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigurationProvider } from '../config';
import { LoggerService } from '../logging/logger.service';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_SILENT_RENEW_IDENTIFIER = 'myiFrameForSilentRenew';

@Injectable()
export class OidcSecuritySilentRenew {
    constructor(
        private loggerService: LoggerService,
        private iFrameService: IFrameService,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    private boundSilentRenewEvent: any;

    init() {
        this.getOrCreateIframe();
        // Support authorization via DOM events.
        // Deregister if OidcSecurityService.setupModule is called again by any instance.
        //      We only ever want the latest setup service to be reacting to this event.
        this.boundSilentRenewEvent = this.silentRenewEventHandler.bind(this);

        const instanceId = Math.random();

        const boundSilentRenewInitEvent: any = ((e: CustomEvent) => {
            if (e.detail !== instanceId) {
                window.removeEventListener('oidc-silent-renew-message', this.boundSilentRenewEvent);
                window.removeEventListener('oidc-silent-renew-init', boundSilentRenewInitEvent);
            }
        }).bind(this);

        window.addEventListener('oidc-silent-renew-init', boundSilentRenewInitEvent, false);
        window.addEventListener('oidc-silent-renew-message', this.boundSilentRenewEvent, false);

        window.dispatchEvent(
            new CustomEvent('oidc-silent-renew-init', {
                detail: instanceId,
            })
        );
    }

    private getOrCreateIframe(): HTMLIFrameElement {
        const existingIframe = this.getExistingIframe();

        if (!existingIframe) {
            return this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);
        }

        return existingIframe;
    }

    private getExistingIframe() {
        return this.iFrameService.getExistingIFrame(IFRAME_FOR_SILENT_RENEW_IDENTIFIER);
    }

    startRenew(url: string): Observable<void> {
        const sessionIframe = this.getOrCreateIframe();
        this.loggerService.logDebug('startRenew for URL:' + url);
        return new Observable<void>((observer) => {
            const onLoadHandler = () => {
                sessionIframe.removeEventListener('load', onLoadHandler);
                observer.next(undefined);
                observer.complete();
            };
            sessionIframe.addEventListener('load', onLoadHandler);
            sessionIframe.src = url;
            return () => {
                sessionIframe.removeEventListener('load', onLoadHandler);
            };
        });
    }

    private silentRenewEventHandler(e: CustomEvent) {
        this.loggerService.logDebug('silentRenewEventHandler');

        if (this.configurationProvider.openIDConfiguration.responseType === 'code') {
            const urlParts = e.detail.toString().split('?');
            const params = new HttpParams({
                fromString: urlParts[1],
            });
            const code = params.get('code');
            const state = params.get('state');
            const sessionState = params.get('session_state');
            const error = params.get('error');
            if (code && state) {
                this.requestTokensWithCodeProcedure(code, state, sessionState);
            }
            if (error) {
                this.onAuthorizationResultInternal.next(
                    new AuthorizationResult(AuthorizationState.unauthorized, ValidationResult.LoginRequired, true)
                );
                this.resetAuthorizationData(false);
                this.storagePersistanceService.authNonce = '';
                this.loggerService.logDebug(e.detail.toString());
            }
        } else {
            // ImplicitFlow
            this.authorizedImplicitFlowCallback(e.detail);
        }
    }
}
