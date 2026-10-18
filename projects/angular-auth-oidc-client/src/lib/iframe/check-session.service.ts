import { inject, Injectable, NgZone, OnDestroy, DOCUMENT } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthWellKnownEndpoints } from '../config/auth-well-known/auth-well-known-endpoints';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/services/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { IFrameService } from './existing-iframe.service';

const IFRAME_FOR_CHECK_SESSION_IDENTIFIER = 'myiFrameForCheckSession';
const MAX_UNANSWERED_MESSAGES = 3;

@Injectable({ providedIn: 'root' })
export class CheckSessionService implements OnDestroy {
  private checkSessionReceived = false;
  private scheduledHeartBeatRunning: number | null = null;
  private lastIFrameRefresh = 0;
  private outstandingMessages = 0;
  private iframeMessageEventListener?: (
    this: Window,
    ev: MessageEvent<any>
  ) => any;

  private readonly loggerService = inject(LoggerService);
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly iFrameService = inject(IFrameService);
  private readonly eventService = inject(PublicEventsService);
  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

  private readonly heartBeatInterval = 3000;
  private readonly iframeRefreshInterval = 60000;
  private readonly checkSessionChangedInternal$ = new BehaviorSubject<boolean>(
    false
  );

  get checkSessionChanged$(): Observable<boolean> {
    return this.checkSessionChangedInternal$.asObservable();
  }

  ngOnDestroy(): void {
    this.stop();
    this.removeMessageEventListener();
  }

  isCheckSessionConfigured(configuration: OpenIdConfiguration): boolean {
    const { startCheckSession } = configuration;

    return Boolean(startCheckSession);
  }

  start(configuration: OpenIdConfiguration): void {
    if (this.scheduledHeartBeatRunning) {
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

  private pollServerSession(
    clientId: string | undefined,
    configuration: OpenIdConfiguration
  ): void {
    this.outstandingMessages = 0;
    this.beatHeart(clientId, configuration);
  }

  private beatHeart(
    clientId: string | undefined,
    configuration: OpenIdConfiguration
  ): void {
    this.init(configuration)
      .pipe(take(1))
      .subscribe(() => {
        this.checkServerSession(clientId, configuration);
        this.complainWhenServerStopsAnswering(configuration);
        this.scheduleNextHeartBeat(clientId, configuration);
      });
  }

  private init(configuration: OpenIdConfiguration): Observable<void> {
    if (this.wasIframeRefreshedRecently()) {
      return of();
    }

    const authWellKnownEndPoints =
      this.readAuthWellKnownEndPoints(configuration);

    if (!authWellKnownEndPoints) {
      this.loggerService.logWarning(
        configuration,
        'CheckSession - init check session: authWellKnownEndpoints is undefined. Returning.'
      );

      return of();
    }

    const existingIframe = this.getOrCreateIframe(configuration);

    this.bindMessageEventToIframe(configuration);

    const { checkSessionIframe } = authWellKnownEndPoints;

    if (!checkSessionIframe) {
      this.loggerService.logWarning(
        configuration,
        'CheckSession - init check session: checkSessionIframe is not configured to run'
      );

      return of();
    }

    this.navigateIframeTo(existingIframe, checkSessionIframe, configuration);

    return this.waitUntilIframeLoaded(existingIframe);
  }

  private wasIframeRefreshedRecently(): boolean {
    return this.lastIFrameRefresh + this.iframeRefreshInterval > Date.now();
  }

  private navigateIframeTo(
    iframe: HTMLIFrameElement,
    url: string,
    configuration: OpenIdConfiguration
  ): void {
    const { contentWindow } = iframe;

    if (!contentWindow) {
      this.loggerService.logWarning(
        configuration,
        'CheckSession - init check session: IFrame contentWindow does not exist'
      );

      return;
    }

    contentWindow.location.replace(url);
  }

  private waitUntilIframeLoaded(iframe: HTMLIFrameElement): Observable<void> {
    return new Observable((observer) => {
      iframe.onload = (): void => {
        this.lastIFrameRefresh = Date.now();
        observer.next();
        observer.complete();
      };
    });
  }

  private checkServerSession(
    clientId: string | undefined,
    configuration: OpenIdConfiguration
  ): void {
    const existingIframe = this.getExistingIframe();

    if (!existingIframe || !clientId) {
      this.loggerService.logWarning(
        configuration,
        `CheckSession - OidcSecurityCheckSession pollServerSession checkSession IFrame does not exist:
               clientId : '${clientId}' - existingIframe: '${existingIframe}'`
      );

      return;
    }

    this.loggerService.logDebug(
      configuration,
      `CheckSession - clientId : '${clientId}' - existingIframe: '${existingIframe}'`
    );
    this.askIframeWhetherSessionChanged(
      existingIframe,
      clientId,
      configuration
    );
  }

  private askIframeWhetherSessionChanged(
    iframe: HTMLIFrameElement,
    clientId: string,
    configuration: OpenIdConfiguration
  ): void {
    const sessionState = this.storagePersistenceService.read(
      'session_state',
      configuration
    );
    const authWellKnownEndPoints =
      this.readAuthWellKnownEndPoints(configuration);
    const checkSessionIframe = authWellKnownEndPoints?.checkSessionIframe;
    const { contentWindow } = iframe;

    if (!sessionState || !checkSessionIframe || !contentWindow) {
      this.reportSessionCannotBeChecked(
        sessionState,
        authWellKnownEndPoints,
        configuration
      );

      return;
    }

    this.outstandingMessages++;
    contentWindow.postMessage(
      clientId + ' ' + sessionState,
      new URL(checkSessionIframe).origin
    );
  }

  private reportSessionCannotBeChecked(
    sessionState: string | null,
    authWellKnownEndPoints: AuthWellKnownEndpoints | null,
    configuration: OpenIdConfiguration
  ): void {
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

  private complainWhenServerStopsAnswering(
    configuration: OpenIdConfiguration
  ): void {
    if (this.outstandingMessages <= MAX_UNANSWERED_MESSAGES) {
      return;
    }

    this.loggerService.logError(
      configuration,
      `CheckSession - OidcSecurityCheckSession not receiving check session response messages.
                            Outstanding messages: '${this.outstandingMessages}'. Server unreachable?`
    );
  }

  private scheduleNextHeartBeat(
    clientId: string | undefined,
    configuration: OpenIdConfiguration
  ): void {
    this.zone.runOutsideAngular(() => {
      this.scheduledHeartBeatRunning =
        this.document?.defaultView?.setTimeout(
          () => this.zone.run(() => this.beatHeart(clientId, configuration)),
          this.heartBeatInterval
        ) ?? null;
    });
  }

  private clearScheduledHeartBeat(): void {
    if (this.scheduledHeartBeatRunning === null) {
      return;
    }

    clearTimeout(this.scheduledHeartBeatRunning);
    this.scheduledHeartBeatRunning = null;
  }

  private messageHandler(configuration: OpenIdConfiguration, e: any): void {
    if (!this.isMessageFromCheckSessionIframe(e, configuration)) {
      return;
    }

    this.outstandingMessages = 0;
    this.handleCheckSessionAnswer(e, configuration);
  }

  private isMessageFromCheckSessionIframe(
    e: any,
    configuration: OpenIdConfiguration
  ): boolean {
    const existingIframe = this.getExistingIframe();
    const expectedOrigin = this.getOriginOrNull(
      this.readAuthWellKnownEndPoints(configuration)?.checkSessionIframe
    );
    const originMatches =
      expectedOrigin !== null && e.origin === expectedOrigin;

    return (
      !!existingIframe &&
      originMatches &&
      e.source === existingIframe.contentWindow
    );
  }

  private handleCheckSessionAnswer(
    e: any,
    configuration: OpenIdConfiguration
  ): void {
    if (e.data === 'error') {
      this.loggerService.logWarning(
        configuration,
        'CheckSession - error from check session messageHandler'
      );

      return;
    }

    if (e.data === 'changed') {
      this.handleSessionChanged(e, configuration);

      return;
    }

    this.handleSessionUnchanged(e, configuration);
  }

  private handleSessionChanged(
    e: any,
    configuration: OpenIdConfiguration
  ): void {
    this.loggerService.logDebug(
      configuration,
      `CheckSession - ${e} from check session messageHandler`
    );
    this.checkSessionReceived = true;
    this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
    this.checkSessionChangedInternal$.next(true);
  }

  private handleSessionUnchanged(
    e: any,
    configuration: OpenIdConfiguration
  ): void {
    this.eventService.fireEvent(EventTypes.CheckSessionReceived, e.data);
    this.loggerService.logDebug(
      configuration,
      `CheckSession - ${e.data} from check session messageHandler`
    );
  }

  private bindMessageEventToIframe(configuration: OpenIdConfiguration): void {
    this.removeMessageEventListener();
    this.iframeMessageEventListener = this.messageHandler.bind(
      this,
      configuration
    );
    this.document.defaultView?.addEventListener(
      'message',
      this.iframeMessageEventListener,
      false
    );
  }

  private removeMessageEventListener(): void {
    const defaultView = this.document.defaultView;

    if (defaultView && this.iframeMessageEventListener) {
      defaultView.removeEventListener(
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

  private readAuthWellKnownEndPoints(
    configuration: OpenIdConfiguration
  ): AuthWellKnownEndpoints | null {
    return this.storagePersistenceService.read(
      'authWellKnownEndPoints',
      configuration
    );
  }

  private getOriginOrNull(url: string | undefined | null): string | null {
    if (!url) {
      return null;
    }

    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }
}
