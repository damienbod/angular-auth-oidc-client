import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, from, Observable, Observer } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { AuthConfiguration } from '../modules/auth.configuration';
import { IFrameService } from './existing-iframe.service';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCommon } from './oidc.security.common';

const IFRAME_FOR_CHECK_SESSION_IDENTIFIER = 'myiFrameForCheckSession';

// http://openid.net/specs/openid-connect-session-1_0-ID4.html

@Injectable()
export class OidcSecurityCheckSession {
    private sessionIframe: any;
    private iframeMessageEvent: any;
    private authWellKnownEndpoints: AuthWellKnownEndpoints | undefined;
    private scheduledHeartBeat: any;
    private lastIFrameRefresh = 0;
    private outstandingMessages = 0;
    private heartBeatInterval = 3000;
    private iframeRefreshInterval = 60000;
    onCheckSessionChanged: BehaviorSubject<any> = new BehaviorSubject<any>(true);

    constructor(
        private authConfiguration: AuthConfiguration,
        private oidcSecurityCommon: OidcSecurityCommon,
        private loggerService: LoggerService,
        private iFrameService: IFrameService,
        private zone: NgZone
    ) {}

    setupModule(authWellKnownEndpoints: AuthWellKnownEndpoints) {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
    }

    private doesSessionExist(): boolean {
        const existingIFrame = this.iFrameService.getExistingIFrame(IFRAME_FOR_CHECK_SESSION_IDENTIFIER);

        if (!existingIFrame) {
            return false;
        }

        this.sessionIframe = existingIFrame;
        return true;
    }

    private init() {
        if (this.lastIFrameRefresh + this.iframeRefreshInterval > Date.now()) {
            return from([this]);
        }

        if (!this.doesSessionExist()) {
            this.sessionIframe = this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_CHECK_SESSION_IDENTIFIER);
            this.iframeMessageEvent = this.messageHandler.bind(this);
            window.addEventListener('message', this.iframeMessageEvent, false);
        }

        if (this.authWellKnownEndpoints) {
            this.sessionIframe.src = this.authWellKnownEndpoints.check_session_iframe;
        } else {
            this.loggerService.logWarning('init check session: authWellKnownEndpoints is undefined');
        }

        return Observable.create((observer: Observer<OidcSecurityCheckSession>) => {
            this.sessionIframe.onload = () => {
                this.lastIFrameRefresh = Date.now();
                observer.next(this);
                observer.complete();
            };
        });
    }

    startCheckingSession(clientId: string): void {
        if (this.scheduledHeartBeat) {
            return;
        }

        this.pollServerSession(clientId);
    }

    stopCheckingSession(): void {
        if (!this.scheduledHeartBeat) {
            return;
        }

        this.clearScheduledHeartBeat();
    }

    private pollServerSession(clientId: string) {
        const _pollServerSessionRecur = () => {
            this.init()
                .pipe(take(1))
                .subscribe(() => {
                    if (this.sessionIframe && clientId) {
                        this.loggerService.logDebug(this.sessionIframe);
                        const session_state = this.oidcSecurityCommon.sessionState;
                        if (session_state) {
                            this.outstandingMessages++;
                            this.sessionIframe.contentWindow.postMessage(clientId + ' ' + session_state, this.authConfiguration.stsServer);
                        } else {
                            this.loggerService.logDebug('OidcSecurityCheckSession pollServerSession session_state is blank');
                            this.onCheckSessionChanged.next({});
                        }
                    } else {
                        this.loggerService.logWarning('OidcSecurityCheckSession pollServerSession sessionIframe does not exist');
                        this.loggerService.logDebug(clientId);
                        this.loggerService.logDebug(this.sessionIframe);
                        // this.init();
                    }

                    // after sending three messages with no response, fail.
                    if (this.outstandingMessages > 3) {
                        this.loggerService.logError(
                            `OidcSecurityCheckSession not receiving check session response messages. Outstanding messages: ${
                                this.outstandingMessages
                            }. Server unreachable?`
                        );
                        this.onCheckSessionChanged.next({});
                    }

                    this.scheduledHeartBeat = setTimeout(_pollServerSessionRecur, this.heartBeatInterval);
                });
        };

        this.outstandingMessages = 0;

        this.zone.runOutsideAngular(() => {
            this.scheduledHeartBeat = setTimeout(_pollServerSessionRecur, this.heartBeatInterval);
        });
    }
    private clearScheduledHeartBeat() {
        clearTimeout(this.scheduledHeartBeat);
        this.scheduledHeartBeat = null;
    }

    private messageHandler(e: any) {
        this.outstandingMessages = 0;
        if (this.sessionIframe && e.origin === this.authConfiguration.stsServer && e.source === this.sessionIframe.contentWindow) {
            if (e.data === 'error') {
                this.loggerService.logWarning('error from checksession messageHandler');
            } else if (e.data === 'changed') {
                this.onCheckSessionChanged.next({});
            } else {
                this.loggerService.logDebug(e.data + ' from checksession messageHandler');
            }
        }
    }
}
