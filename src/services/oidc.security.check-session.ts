import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { timer } from 'rxjs/observable/timer';
import { pluck, take, timeInterval } from 'rxjs/operators';
import { Observer } from 'rxjs/Observer';
import { AuthConfiguration } from '../modules/auth.configuration';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';

// http://openid.net/specs/openid-connect-session-1_0-ID4.html

@Injectable()
export class OidcSecurityCheckSession {
    private sessionIframe: any;
    private iframeMessageEvent: any;

    @Output()
    onCheckSessionChanged: EventEmitter<any> = new EventEmitter<any>(true);

    constructor(
        private authConfiguration: AuthConfiguration,
        private oidcSecurityCommon: OidcSecurityCommon,
        private authWellKnownEndpoints: AuthWellKnownEndpoints
    ) {}

    init() {
        const exists = window.parent.document.getElementById(
            'myiFrameForCheckSession'
        );
        if (!exists) {
            this.sessionIframe = window.document.createElement('iframe');

            this.sessionIframe.id = 'myiFrameForCheckSession';
            this.oidcSecurityCommon.logDebug(this.sessionIframe);
            this.sessionIframe.style.display = 'none';
            this.sessionIframe.src = this.authWellKnownEndpoints.check_session_iframe;

            window.document.body.appendChild(this.sessionIframe);
            this.iframeMessageEvent = this.messageHandler.bind(this);
            window.addEventListener('message', this.iframeMessageEvent, false);

            return Observable.create((observer: Observer<any>) => {
                this.sessionIframe.onload = () => {
                    observer.next(this);
                    observer.complete();
                };
            });
        }

        return of('');
    }

    pollServerSession(clientId: any) {
        const source = timer(3000, 3000).pipe(
            timeInterval(),
            pluck('interval'),
            take(10000)
        );

        source.subscribe(
            () => {
                this.oidcSecurityCommon.logDebug(this.sessionIframe);
                const session_state = this.oidcSecurityCommon.sessionState;
                if (session_state && session_state !== '') {
                    this.sessionIframe.contentWindow.postMessage(
                        clientId + ' ' + session_state,
                        this.authConfiguration.stsServer
                    );
                }
            },
            (err: any) => {
                this.oidcSecurityCommon.logError(
                    'pollServerSession error: ' + err
                );
            },
            () => {
                this.oidcSecurityCommon.logDebug(
                    'checksession pollServerSession completed'
                );
            }
        );
    }

    private messageHandler(e: any) {
        if (
            e.origin === this.authConfiguration.stsServer &&
            e.source === this.sessionIframe.contentWindow
        ) {
            if (e.data === 'error') {
                this.oidcSecurityCommon.logWarning(
                    'error from checksession messageHandler'
                );
            } else if (e.data === 'changed') {
                this.onCheckSessionChanged.emit();
            } else {
                this.oidcSecurityCommon.logDebug(
                    e.data + ' from checksession messageHandler'
                );
            }
        }
    }
}
