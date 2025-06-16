import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { PopupOptions } from './popup-options';
import { PopupResult } from './popup-result';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private popUp: Window | null = null;
  private handle = -1;

  private readonly loggerService = inject(LoggerService);
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly document = inject(DOCUMENT);

  private readonly STORAGE_IDENTIFIER = 'popupauth';
  private readonly resultInternal$ = new Subject<PopupResult>();

  get result$(): Observable<PopupResult> {
    return this.resultInternal$.asObservable();
  }

  private get windowInternal(): Window | null {
    return this.document.defaultView;
  }

  isCurrentlyInPopup(config: OpenIdConfiguration): boolean {
    if (this.canAccessSessionStorage()) {
      const popup = this.storagePersistenceService.read(
        this.STORAGE_IDENTIFIER,
        config
      );
      const windowIdentifier = this.windowInternal;

      if (!windowIdentifier) {
        return false;
      }

      return (
        Boolean(windowIdentifier.opener) &&
        windowIdentifier.opener !== windowIdentifier &&
        Boolean(popup)
      );
    }

    return false;
  }

  openPopUp(
    url: string | null,
    popupOptions: PopupOptions | undefined,
    config: OpenIdConfiguration
  ): void {
    const optionsToPass = this.getOptions(popupOptions);

    this.storagePersistenceService.write(
      this.STORAGE_IDENTIFIER,
      'true',
      config
    );

    const windowIdentifier = this.windowInternal;

    if (!windowIdentifier) {
      return;
    }

    if (!url) {
      this.loggerService.logError(config, 'Could not open popup, url is empty');

      return;
    }

    this.popUp = windowIdentifier.open(url, '_blank', optionsToPass);

    if (!this.popUp) {
      this.storagePersistenceService.remove(this.STORAGE_IDENTIFIER, config);
      this.loggerService.logError(config, 'Could not open popup');

      return;
    }

    this.loggerService.logDebug(config, 'Opened popup with url ' + url);

    const listener = (event: MessageEvent): void => {
      if (!event?.data || typeof event.data !== 'string') {
        if (config.disableCleaningPopupOnInvalidMessage) {
          return;
        }
        this.cleanUp(listener, config);

        return;
      }

      this.loggerService.logDebug(
        config,
        'Received message from popup with url ' + event.data
      );

      this.resultInternal$.next({ userClosed: false, receivedUrl: event.data });

      this.cleanUp(listener, config);
    };

    windowIdentifier.addEventListener('message', listener, false);

    this.handle = windowIdentifier.setInterval(() => {
      if (this.popUp?.closed) {
        this.resultInternal$.next({ userClosed: true, receivedUrl: '' });

        this.cleanUp(listener, config);
      }
    }, 200);
  }

  sendMessageToMainWindow(url: string, config: OpenIdConfiguration): void {
    const windowIdentifier = this.windowInternal;

    if (!windowIdentifier) {
      return;
    }

    if (windowIdentifier.opener) {
      const href = windowIdentifier.location.href;

      this.sendMessage(url, href, config);
    }
  }

  private cleanUp(listener: any, config: OpenIdConfiguration): void {
    const windowIdentifier = this.windowInternal;

    if (!windowIdentifier) {
      return;
    }

    windowIdentifier.removeEventListener('message', listener, false);
    windowIdentifier.clearInterval(this.handle);

    if (this.popUp) {
      this.storagePersistenceService.remove(this.STORAGE_IDENTIFIER, config);
      this.popUp.close();
      this.popUp = null;
    }
  }

  private sendMessage(
    url: string,
    href: string,
    config: OpenIdConfiguration
  ): void {
    const windowIdentifier = this.windowInternal;

    if (!windowIdentifier) {
      return;
    }

    if (!url) {
      this.loggerService.logDebug(
        config,
        `Can not send message to parent, no url: '${url}'`
      );

      return;
    }

    windowIdentifier.opener.postMessage(url, href);
  }

  private getOptions(popupOptions: PopupOptions | undefined): string {
    const popupDefaultOptions = {
      width: 500,
      height: 500,
      left: 50,
      top: 50,
    };
    const options: PopupOptions = {
      ...popupDefaultOptions,
      ...(popupOptions || {}),
    };
    const windowIdentifier = this.windowInternal;

    if (!windowIdentifier) {
      return '';
    }

    const width = options.width || popupDefaultOptions.width;
    const height = options.height || popupDefaultOptions.height;
    const left: number =
      windowIdentifier.screenLeft + (windowIdentifier.outerWidth - width) / 2;
    const top: number =
      windowIdentifier.screenTop + (windowIdentifier.outerHeight - height) / 2;

    options.left = left;
    options.top = top;

    return Object.entries(options)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join(',');
  }

  private canAccessSessionStorage(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      navigator.cookieEnabled &&
      typeof Storage !== 'undefined'
    );
  }
}
