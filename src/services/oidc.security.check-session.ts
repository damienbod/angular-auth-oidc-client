import { EventEmitter, Injectable, NgZone, Output } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { AuthConfiguration } from '../modules/auth.configuration';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCommon } from './oidc.security.common';

// http://openid.net/specs/openid-connect-session-1_0-ID4.html

@Injectable()
export class OidcSecurityCheckSession {
    private sessionIframe: any;
    private iframeMessageEvent: any;
    private authWellKnownEndpoints: AuthWellKnownEndpoints | undefined;
    private scheduledHeartBeat: any;

    @Output()
    onCheckSessionChanged: EventEmitter<any> = new EventEmitter<any>(true);

    constructor(
        private authConfiguration: AuthConfiguration,
        private oidcSecurityCommon: OidcSecurityCommon,
        private loggerService: LoggerService,
        private zone: NgZone
    ) {}

    setupModule(authWellKnownEndpoints: AuthWellKnownEndpoints) {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
    }

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
        const exists = window.document.getElementById('myiFrameForCheckSession');
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
        this.loggerService.logDebug(this.sessionIframe);
        this.sessionIframe.style.display = 'none';
        window.document.body.appendChild(this.sessionIframe);

        if (this.authWellKnownEndpoints) {
            this.sessionIframe.src = this.authWellKnownEndpoints.check_session_iframe;
        } else {
            this.loggerService.logWarning(
                'init check session: authWellKnownEndpoints is undefined'
            );
        }

        this.iframeMessageEvent = this.messageHandler.bind(this);
        window.addEventListener('message', this.iframeMessageEvent, false);

        return Observable.create((observer: Observer<any>) => {
            this.sessionIframe.onload = () => {
                observer.next(this);
                observer.complete();
            };
        });
    }

    startCheckingSession(clientId: any): void {
        if (!this.scheduledHeartBeat) {
            this.pollServerSession(clientId);
        }
    }

    stopCheckingSession(): void {
        if (this.scheduledHeartBeat) {
            clearTimeout(this.scheduledHeartBeat);
            this.scheduledHeartBeat = null;
        }
    }

    pollServerSession(clientId: any) {
        const _pollServerSessionRecur = () => {
            if (this.sessionIframe && clientId) {
                this.loggerService.logDebug(this.sessionIframe);
                const session_state = this.oidcSecurityCommon.sessionState;
                if (session_state) {
                    this.sessionIframe.contentWindow.postMessage(
                        clientId + ' ' + session_state,
                        this.authConfiguration.stsServer
                    );
                }
            } else {
                this.loggerService.logWarning(
                    'OidcSecurityCheckSession pollServerSession sessionIframe does not exist'
                );
                this.loggerService.logDebug(clientId);
                this.loggerService.logDebug(this.sessionIframe);
                // this.init();
            }
            this.scheduledHeartBeat = setTimeout(_pollServerSessionRecur, 3000);
        };

        this.zone.runOutsideAngular(() => {
            this.scheduledHeartBeat = setTimeout(_pollServerSessionRecur, 3000);
        });
    }

    private messageHandler(e: any) {
        if (
            this.sessionIframe &&
            e.origin === this.authConfiguration.stsServer &&
            e.source === this.sessionIframe.contentWindow
        ) {
            if (e.data === 'error') {
                this.loggerService.logWarning('error from checksession messageHandler');
            } else if (e.data === 'changed') {
                this.onCheckSessionChanged.emit();
            } else {
                this.loggerService.logDebug(e.data + ' from checksession messageHandler');
            }
        }
    }
}
