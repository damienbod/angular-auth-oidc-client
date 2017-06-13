import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/timer';
import { AuthConfiguration } from '../auth.configuration';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
import { Observer } from 'rxjs/Observer';

// http://openid.net/specs/openid-connect-session-1_0-ID4.html

@Injectable()
export class OidcSecurityCheckSession {

    private sessionIframe: any;
    private iframeMessageEvent: any;

    @Output() onCheckSessionChanged: EventEmitter<any> = new EventEmitter<any>(true);

    constructor(
        private authConfiguration: AuthConfiguration,
        private oidcSecurityCommon: OidcSecurityCommon,
        private authWellKnownEndpoints: AuthWellKnownEndpoints
    ) {
    }

    init() {
        this.sessionIframe = window.document.createElement('iframe');
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
            }
        });
    }

    pollServerSession(session_state: any, clientId: any) {
        let source = Observable.timer(3000, 3000)
            .timeInterval()
            .pluck('interval')
            .take(10000);

        let subscription = source.subscribe(() => {
                this.oidcSecurityCommon.logDebug(this.sessionIframe);
                this.sessionIframe.contentWindow.postMessage(clientId + ' ' + session_state, this.authConfiguration.stsServer);
            },
            (err: any) => {
                this.oidcSecurityCommon.logError('pollServerSession error: ' + err);
            },
            () => {
                this.oidcSecurityCommon.logDebug('checksession pollServerSession completed');
            });
    }

    private messageHandler(e: any) {
        if (e.origin === this.authConfiguration.stsServer &&
            e.source === this.sessionIframe.contentWindow
        ) {
            if (e.data === 'error') {
                this.oidcSecurityCommon.logWarning('error from checksession messageHandler');
            } else if (e.data === 'changed') {
                this.onCheckSessionChanged.emit();
            } else {
                this.oidcSecurityCommon.logDebug(e.data + ' from checksession messageHandler');
            }
        }
    }
}