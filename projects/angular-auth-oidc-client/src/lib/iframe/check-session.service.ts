import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_CHECK_SESSION_IDENTIFIER = 'myiFrameForCheckSession';

// http://openid.net/specs/openid-connect-session-1_0-ID4.html

@Injectable({ providedIn: 'root' })
export class CheckSessionService implements OnDestroy {
  private readonly loggerService = inject(LoggerService);

  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );

  private readonly iFrameService = inject(IFrameService);

  private readonly eventService = inject(PublicEventsService);

  private readonly zone = inject(NgZone);

  private readonly document = inject(DOCUMENT);

  private checkSessionReceived = false;

  private scheduledHeartBeatRunning: number | null = null;

  private lastIFrameRefresh = 0;

  private outstandingMessages = 0;

  private readonly heartBeatInterval = 3000;

  private readonly iframeRefreshInterval = 60000;

  private readonly checkSessionChangedInternal$ = new BehaviorSubject<boolean>(
    false
  );

  private iframeMessageEventListener?: (
    this: Window,
    ev: MessageEvent<any>
  ) => any;

  get checkSessionChanged$(): Observable<boolean> {
    return this.checkSessionChangedInternal$.asObservable();
  }

  ngOnDestroy(): void {
    this.stop();
    const windowAsDefaultView = this.document.defaultView;

    if (windowAsDefaultView && this.iframeMessageEventListener) {
      windowAsDefaultView.removeEventListener(
        'message',
        this.iframeMessageEventListener,
        false
      );
    }
  }

  isCheckSessionConfigured(configuration: OpenIdConfiguration): boolean {
    const { startCheckSession } = configuration;

    return Boolean(startCheckSession);
  }

  start(configuration: OpenIdConfiguration): void {
    if (!!this.scheduledHeartBeatRunning) {
      return;
    }

    const { clientId } = configuration;

    this.pollServerSession(clientId, configuration);
  }

  stop(): void {
    if (!this.scheduledHeartBeatRunning) {
      return;
    }

    this.clearScheduledHeartBeat();
    this.checkSessionReceived = false;
  }

  serverStateChanged(configuration: OpenIdConfiguration): boolean {
    const { startCheckSession } = configuration;

    return Boolean(startCheckSession) && this.checkSessionReceived;
  }

  getExistingIframe(): HTMLIFrameElement | null {
    return this.iFrameService.getExistingIFrame(
      IFRAME_FOR_CHECK_SESSION_IDENTIFIER
    );
  }

  private init(configuration: OpenIdConfiguration): Observable<void> {
    if (this.lastIFrameRefresh + this.iframeRefreshInterval > Date.now()) {
      return of();
    }

    const authWellKnownEndPoints = this.storagePersistenceService.read(
      'authWellKnownEndPoints',
      configuration
    );

    if (!authWellKnownEndPoints) {
      this.loggerService.logWarning(
        configuration,
        'CheckSession - init check session: authWellKnownEndpoints is undefined. Returning.'
      );

      return of();
    }

    const existingIframe = this.getOrCreateIframe(configuration);

    // https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-EventTarget-addEventListener
    // If multiple identical EventListeners are registered on the same EventTarget with the same parameters the duplicate instances are discarded. They do not cause the EventListener to be called twice and since they are discarded they do not need to be removed with the removeEventListener method.
    // this is done even if iframe exists for HMR to work, since iframe exists on service init
    this.bindMessageEventToIframe(configuration);
    const checkSessionIframe = authWellKnownEndPoints.checkSessionIframe;
    const contentWindow = existingIframe.contentWindow;

    if (!checkSessionIframe) {
      this.loggerService.logWarning(
        configuration,
        'CheckSession - init check session: checkSessionIframe is not configured to run'
      );

      return of();
    }

    if (!contentWindow) {
      this.loggerService.logWarning(
        configuration,
        'CheckSession - init check session: IFrame contentWindow does not exist'
      );
    } else {
      contentWindow.location.replace(checkSessionIframe);
    }

    return new Observable((observer) => {
      existingIframe.onload = (): void => {
        this.lastIFrameRefresh = Date.now();
        observer.next();
        observer.complete();
      };
    });
  }

  private pollServerSession(
    clientId: string | undefined,
    configuration: OpenIdConfiguration
  ): void {
    this.outstandingMessages = 0;

    const pollServerSessionRecur = (): void => {
      this.init(configuration)
        .pipe(take(1))
        .subscribe(() => {
          const existingIframe = this.getExistingIframe();

          if (existingIframe && clientId) {
            this.loggerService.logDebug(
              configuration,
              `CheckSession - clientId : '${clientId}' - existingIframe: '${existingIframe}'`
            );
            const sessionState = this.storagePersistenceService.read(
              'session_state',
              configuration
            );
            const authWellKnownEndPoints = this.storagePersistenceService.read(
              'authWellKnownEndPoints',
              configuration
            );
            const contentWindow = existingIframe.contentWindow;

            if (
              sessionState &&
              authWellKnownEndPoints?.checkSessionIframe &&
              contentWindow
            ) {
              const iframeOrigin = new URL(
                authWellKnownEndPoints.checkSessionIframe
              )?.origin;

              this.outstandingMessages++;
              contentWindow.postMessage(
                clientId + ' ' + sessionState,
                iframeOrigin
              );
            } else {
              this.loggerService.logDebug(
                configuration,
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
              configuration,
              `CheckSession - OidcSecurityCheckSession pollServerSession checkSession IFrame does not exist:
               clientId : '${clientId}' - existingIframe: '${existingIframe}'`
            );
          }

          // after sending three messages with no response, fail.
          if (this.outstandingMessages > 3) {
            this.loggerService.logError(
              configuration,
              `CheckSession - OidcSecurityCheckSession not receiving check session response messages.
                            Outstanding messages: '${this.outstandingMessages}'. Server unreachable?`
            );
          }

          this.zone.runOutsideAngular(() => {
            this.scheduledHeartBeatRunning =
              this.document?.defaultView?.setTimeout(
                () => this.zone.run(pollServerSessionRecur),
                this.heartBeatInterval
              ) ?? null;
          });
        });
    };

    pollServerSessionRecur();
  }

  private clearScheduledHeartBeat(): void {
    if (this.scheduledHeartBeatRunning !== null) {
      clearTimeout(this.scheduledHeartBeatRunning);
      this.scheduledHeartBeatRunning = null;
    }
  }

  private messageHandler(configuration: OpenIdConfiguration, e: any): void {
    const existingIFrame = this.getExistingIframe();
    const authWellKnownEndPoints = this.storagePersistenceService.read(
      'authWellKnownEndPoints',
      configuration
    );
    const startsWith = !!authWellKnownEndPoints?.checkSessionIframe?.startsWith(
      e.origin
    );

    this.outstandingMessages = 0;

    if (
      existingIFrame &&
      startsWith &&
      e.source === existingIFrame.contentWindow
    ) {
      if (e.data === 'error') {
        this.loggerService.logWarning(
          configuration,
          'CheckSession - error from check session messageHandler'
        );
      } else if (e.data === 'changed') {
        this.loggerService.logDebug(
          configuration,
          `CheckSession - ${e} from check session messageHandler`
        );
        this.checkSessionReceived = true;
        this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
        this.checkSessionChangedInternal$.next(true);
      } else {
        this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
        this.loggerService.logDebug(
          configuration,
          `CheckSession - ${e.data} from check session messageHandler`
        );
      }
    }
  }

  private bindMessageEventToIframe(configuration: OpenIdConfiguration): void {
    const defaultView = this.document.defaultView;

    if (this.iframeMessageEventListener && defaultView) {
      defaultView.removeEventListener('message', this.iframeMessageEventListener, false);
    }

    this.iframeMessageEventListener = this.messageHandler.bind(
      this,
      configuration
    );

    if (defaultView) {
      defaultView.addEventListener(
        'message',
        this.iframeMessageEventListener,
        false
      );
    }
  }

  private getOrCreateIframe(
    configuration: OpenIdConfiguration
  ): HTMLIFrameElement {
    return (
      this.getExistingIframe() ||
      this.iFrameService.addIFrameToWindowBody(
        IFRAME_FOR_CHECK_SESSION_IDENTIFIER,
        configuration
      )
    );
  }
}
