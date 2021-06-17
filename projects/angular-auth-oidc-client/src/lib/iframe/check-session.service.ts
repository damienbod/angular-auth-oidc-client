import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
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

  get checkSessionChanged$(): Observable<boolean> {
    return this.checkSessionChangedInternal$.asObservable();
  }

  constructor(
    private storagePersistenceService: StoragePersistenceService,
    private loggerService: LoggerService,
    private iFrameService: IFrameService,
    private eventService: PublicEventsService,
    private configurationProvider: ConfigurationProvider,
    private zone: NgZone
  ) {}

  isCheckSessionConfigured(configId: string): boolean {
    const { startCheckSession } = this.configurationProvider.getOpenIDConfiguration(configId);

    return startCheckSession;
  }

  start(configId: string): void {
    if (!!this.scheduledHeartBeatRunning) {
      return;
    }

    const { clientId } = this.configurationProvider.getOpenIDConfiguration(configId);
    this.pollServerSession(clientId, configId);
  }

  stop(): void {
    if (!this.scheduledHeartBeatRunning) {
      return;
    }

    this.clearScheduledHeartBeat();
    this.checkSessionReceived = false;
  }

  serverStateChanged(configId: string): boolean {
    const { startCheckSession } = this.configurationProvider.getOpenIDConfiguration(configId);

    return startCheckSession && this.checkSessionReceived;
  }

  getExistingIframe(): HTMLIFrameElement {
    return this.iFrameService.getExistingIFrame(IFRAME_FOR_CHECK_SESSION_IDENTIFIER);
  }

  private init(configId: string): Observable<any> {
    if (this.lastIFrameRefresh + this.iframeRefreshInterval > Date.now()) {
      return of(undefined);
    }

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);

    if (!authWellKnownEndPoints) {
      this.loggerService.logWarning(configId, 'CheckSession - init check session: authWellKnownEndpoints is undefined. Returning.');

      return of();
    }

    const existingIframe = this.getOrCreateIframe(configId);
    const checkSessionIframe = authWellKnownEndPoints.checkSessionIframe;

    if (checkSessionIframe) {
      existingIframe.contentWindow.location.replace(checkSessionIframe);
    } else {
      this.loggerService.logWarning(configId, 'CheckSession - init check session: checkSessionIframe is not configured to run');
    }

    return new Observable((observer) => {
      existingIframe.onload = (): void => {
        this.lastIFrameRefresh = Date.now();
        observer.next();
        observer.complete();
      };
    });
  }

  private pollServerSession(clientId: string, configId: string): void {
    this.outstandingMessages = 0;
    const pollServerSessionRecur = (): void => {
      this.init(configId)
        .pipe(take(1))
        .subscribe(() => {
          const existingIframe = this.getExistingIframe();
          if (existingIframe && clientId) {
            this.loggerService.logDebug(configId, `CheckSession - clientId : '${clientId}' - existingIframe: '${existingIframe}'`);
            const sessionState = this.storagePersistenceService.read('session_state', configId);
            const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);

            if (sessionState && authWellKnownEndPoints?.checkSessionIframe) {
              const iframeOrigin = new URL(authWellKnownEndPoints.checkSessionIframe)?.origin;
              this.outstandingMessages++;
              existingIframe.contentWindow.postMessage(clientId + ' ' + sessionState, iframeOrigin);
            } else {
              this.loggerService.logDebug(
                configId,
                `CheckSession - session_state is '${sessionState}' - AuthWellKnownEndPoints is '${JSON.stringify(
                  authWellKnownEndPoints,
                  null,
                  2
                )}'`
              );
              this.checkSessionChangedInternal$.next(true);
            }
          } else {
            this.loggerService.logWarning(
              configId,
              `CheckSession - OidcSecurityCheckSession pollServerSession checkSession IFrame does not exist:
               clientId : '${clientId}' - existingIframe: '${existingIframe}'`
            );
          }

          // after sending three messages with no response, fail.
          if (this.outstandingMessages > 3) {
            this.loggerService.logError(
              configId,
              `CheckSession - OidcSecurityCheckSession not receiving check session response messages.
                            Outstanding messages: '${this.outstandingMessages}'. Server unreachable?`
            );
          }

          this.zone.runOutsideAngular(() => {
            this.scheduledHeartBeatRunning = setTimeout(() => this.zone.run(pollServerSessionRecur), this.heartBeatInterval);
          });
        });
    };

    pollServerSessionRecur();
  }

  private clearScheduledHeartBeat(): void {
    clearTimeout(this.scheduledHeartBeatRunning);
    this.scheduledHeartBeatRunning = null;
  }

  private messageHandler(configId: string, e: any): void {
    const existingIFrame = this.getExistingIframe();
    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);
    const startsWith = !!authWellKnownEndPoints?.checkSessionIframe?.startsWith(e.origin);

    this.outstandingMessages = 0;

    if (existingIFrame && startsWith && e.source === existingIFrame.contentWindow) {
      if (e.data === 'error') {
        this.loggerService.logWarning(configId, 'CheckSession - error from check session messageHandler');
      } else if (e.data === 'changed') {
        this.loggerService.logDebug(configId, `CheckSession - ${e} from check session messageHandler`);
        this.checkSessionReceived = true;
        this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
        this.checkSessionChangedInternal$.next(true);
      } else {
        this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
        this.loggerService.logDebug(configId, `CheckSession - ${e.data} from check session messageHandler`);
      }
    }
  }

  private bindMessageEventToIframe(configId: string): void {
    const iframeMessageEvent = this.messageHandler.bind(this, configId);
    window.addEventListener('message', iframeMessageEvent, false);
  }

  private getOrCreateIframe(configId: string): HTMLIFrameElement {
    const existingIframe = this.getExistingIframe();

    if (!existingIframe) {
      const frame = this.iFrameService.addIFrameToWindowBody(IFRAME_FOR_CHECK_SESSION_IDENTIFIER, configId);
      this.bindMessageEventToIframe(configId);

      return frame;
    }

    return existingIframe;
  }
}
