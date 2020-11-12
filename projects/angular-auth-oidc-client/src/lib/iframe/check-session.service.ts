import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_CHECK_SESSION_IDENTIFIER = 'myiFrameForCheckSession';

// http://openid.net/specs/openid-connect-session-1_0-ID4.html

@Injectable()
export class CheckSessionService {
    private checkSessionReceived = false;
    private scheduledHeartBeatRunning: any;
    private lastIFrameRefresh = 0;
    private outstandingMessages = 0;
    private heartBeatInterval = 3000;
    private iframeRefreshInterval = 60000;

    private checkSessionChangedInternal$ = new BehaviorSubject<boolean>(false);

    get checkSessionChanged$() {
        return this.checkSessionChangedInternal$.asObservable();
    }
    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private loggerService: LoggerService,
        private iFrameService: IFrameService,
        private zone: NgZone,
        private eventService: PublicEventsService,
        private configurationProvider: ConfigurationProvider
    ) {}

    isCheckSessionConfigured() {
        return this.configurationProvider.openIDConfiguration.startCheckSession;
    }

    start(): void {
        if (!!this.scheduledHeartBeatRunning) {
            return;
        }

        const clientId = this.configurationProvider.openIDConfiguration.clientId;
        this.pollServerSession(clientId);
    }

    stop(): void {
        if (!this.scheduledHeartBeatRunning) {
            return;
        }

        this.clearScheduledHeartBeat();
        this.checkSessionReceived = false;
    }

    serverStateChanged() {
        return this.configurationProvider.openIDConfiguration.startCheckSession && this.checkSessionReceived;
    }

    private init(): Observable<any> {
        if (this.lastIFrameRefresh + this.iframeRefreshInterval > Date.now()) {
            return of(undefined);
        }

        const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');

        if (!authWellKnownEndPoints) {
            this.loggerService.logWarning('init check session: authWellKnownEndpoints is undefined. Returning.');
            return of();
        }

        const existingIframe = this.getOrCreateIframe();
        const checkSessionIframe = authWellKnownEndPoints.checkSessionIframe;

        if (checkSessionIframe) {
            existingIframe.contentWindow.location.replace(checkSessionIframe);
        } else {
            this.loggerService.logWarning('init check session: checkSessionIframe is not configured to run');
        }

        return new Observable((observer) => {
            existingIframe.onload = () => {
                this.lastIFrameRefresh = Date.now();
                observer.next();
                observer.complete();
            };
        });
    }

    private pollServerSession(clientId: string) {
        this.outstandingMessages = 0;
        const pollServerSessionRecur = () => {
            this.init()
                .pipe(take(1))
                .subscribe(() => {
                    const existingIframe = this.getExistingIframe();
                    if (existingIframe && clientId) {
                        this.loggerService.logDebug(existingIframe);
                        const sessionState = this.storagePersistanceService.read('session_state');
                        if (sessionState) {
                            this.outstandingMessages++;
                            existingIframe.contentWindow.postMessage(
                                clientId + ' ' + sessionState,
                                this.configurationProvider.openIDConfiguration.stsServer
                            );
                        } else {
                            this.loggerService.logDebug('OidcSecurityCheckSession pollServerSession session_state is blank');
                            this.checkSessionChangedInternal$.next(true);
                        }
                    } else {
                        this.loggerService.logWarning('OidcSecurityCheckSession pollServerSession checkSession IFrame does not exist');
                        this.loggerService.logDebug(clientId);
                        this.loggerService.logDebug(existingIframe);
                    }

                    // after sending three messages with no response, fail.
                    if (this.outstandingMessages > 3) {
                        this.loggerService.logError(
                            `OidcSecurityCheckSession not receiving check session response messages. Outstanding messages: ${this.outstandingMessages}. Server unreachable?`
                        );
                    }

                    this.scheduledHeartBeatRunning = setTimeout(pollServerSessionRecur, this.heartBeatInterval);
                });
        };

        pollServerSessionRecur();
    }

    private clearScheduledHeartBeat() {
        clearTimeout(this.scheduledHeartBeatRunning);
        this.scheduledHeartBeatRunning = null;
    }

    private messageHandler(e: any) {
        const existingIFrame = this.getExistingIframe();
        this.outstandingMessages = 0;
        if (
            existingIFrame &&
            this.configurationProvider.openIDConfiguration.stsServer.startsWith(e.origin) &&
            e.source === existingIFrame.contentWindow
        ) {
            if (e.data === 'error') {
                this.loggerService.logWarning('error from checksession messageHandler');
            } else if (e.data === 'changed') {
                this.loggerService.logDebug(e);
                this.checkSessionReceived = true;
                this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
                this.checkSessionChangedInternal$.next(true);
            } else {
                this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
                this.loggerService.logDebug(e.data + ' from checksession messageHandler');
            }
        }
    }

    getExistingIframe() {
        return this.iFrameService.getExistingIFrame(IFRAME_FOR_CHECK_SESSION_IDENTIFIER);
    }

    private bindMessageEventToIframe() {
        const iframeMessageEvent = this.messageHandler.bind(this);
        window.addEventListener('message', iframeMessageEvent, false);
    }

    private getOrCreateIframe() {
        const existingIframe = this.getExistingIframe();

        if (!existingIframe) {
            const frame = this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_CHECK_SESSION_IDENTIFIER);
            this.bindMessageEventToIframe();
            return frame;
        }

        return existingIframe;
    }
}
