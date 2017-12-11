import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
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

    doesSessionExist(): boolean {
        let existsparent = undefined;
        try {
            const parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }

            existsparent = parentdoc.getElementById('myiFrameForCheckSession');
        } catch (e) {
            // not accessible
        }
        const exists = window.document.getElementById(
            'myiFrameForCheckSession'
        );
        if (existsparent) {
            this.sessionIframe = existsparent;
        } else if (exists) {
            this.sessionIframe = exists;
        }

        if (existsparent || exists) {
            return true;
        }

        return false;
    }

    init() {
        this.sessionIframe = window.document.createElement('iframe');
        this.sessionIframe.id = 'myiFrameForCheckSession';
        this.oidcSecurityCommon.logDebug(this.sessionIframe);
        this.sessionIframe.style.display = 'none';
        window.document.body.appendChild(this.sessionIframe);
        this.sessionIframe.src = this.authWellKnownEndpoints.check_session_iframe;

        this.iframeMessageEvent = this.messageHandler.bind(this);
        window.addEventListener('message', this.iframeMessageEvent, false);

        return Observable.create((observer: Observer<any>) => {
            this.sessionIframe.onload = () => {
                observer.next(this);
                observer.complete();
            };
        });
    }

    pollServerSession(clientId: any) {
        const source = timer(3000, 3000).pipe(
            timeInterval(),
            pluck('interval'),
            take(10000)
        );

        source.subscribe(
            () => {
                if (this.sessionIframe && clientId) {
                    this.oidcSecurityCommon.logDebug(this.sessionIframe);
                    const session_state = this.oidcSecurityCommon.sessionState;
                    if (session_state) {
                        this.sessionIframe.contentWindow.postMessage(
                            clientId + ' ' + session_state,
                            this.authConfiguration.stsServer
                        );
                    }
                } else {
                    this.oidcSecurityCommon.logWarning(
                        'OidcSecurityCheckSession pollServerSession sessionIframe does not exist'
                    );
                    this.oidcSecurityCommon.logDebug(clientId);
                    this.oidcSecurityCommon.logDebug(this.sessionIframe);
                    // this.init();
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
            this.sessionIframe &&
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
