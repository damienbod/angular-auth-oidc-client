import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { StoragePersistenceService } from '../../storage/storage-persistence.service';
import { PopupOptions } from './popup-options';
import { PopupResult } from './popup-result';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private readonly STORAGE_IDENTIFIER = 'popupauth';

  private popUp: Window;

  private handle: number;

  private readonly resultInternal$ = new Subject<PopupResult>();

  get result$(): Observable<PopupResult> {
    return this.resultInternal$.asObservable();
  }

  private get windowInternal(): Window {
    return this.document.defaultView;
  }

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly loggerService: LoggerService,
    private readonly storagePersistenceService: StoragePersistenceService
  ) {}

  isCurrentlyInPopup(config: OpenIdConfiguration): boolean {
    if (this.canAccessSessionStorage()) {
      const popup = this.storagePersistenceService.read(this.STORAGE_IDENTIFIER, config);

      return !!this.windowInternal.opener && this.windowInternal.opener !== this.windowInternal && !!popup;
    }

    return false;
  }

  openPopUp(url: string, popupOptions: PopupOptions, config: OpenIdConfiguration): void {
    const optionsToPass = this.getOptions(popupOptions);

    this.popUp = this.windowInternal.open(url, '_blank', optionsToPass);

    if (!this.popUp) {
      this.loggerService.logError(config, 'Could not open popup');

      return;
    }

    this.storagePersistenceService.write(this.STORAGE_IDENTIFIER, 'true', config);

    const listener = (event: MessageEvent): void => {
      if (!event?.data || typeof event.data !== 'string') {
        this.cleanUp(listener, config);

        return;
      }

      this.resultInternal$.next({ userClosed: false, receivedUrl: event.data });

      this.cleanUp(listener, config);
    };

    this.windowInternal.addEventListener('message', listener, false);

    this.handle = this.windowInternal.setInterval(() => {
      if (this.popUp?.closed) {
        this.resultInternal$.next({ userClosed: true });

        this.cleanUp(listener, config);
      }
    }, 200);
  }

  sendMessageToMainWindow(url: string): void {
    if (this.windowInternal.opener) {
      const href = this.windowInternal.location.href;

      this.sendMessage(url, href);
    }
  }

  private cleanUp(listener: any, config: OpenIdConfiguration): void {
    this.windowInternal.removeEventListener('message', listener, false);
    this.windowInternal.clearInterval(this.handle);

    if (this.popUp) {
      this.storagePersistenceService.remove(this.STORAGE_IDENTIFIER, config);
      this.popUp.close();
      this.popUp = null;
    }
  }

  private sendMessage(url: string, href: string): void {
    this.windowInternal.opener.postMessage(url, href);
  }

  private getOptions(popupOptions: PopupOptions): string {
    const popupDefaultOptions: PopupOptions = { width: 500, height: 500, left: 50, top: 50 };
    const options: PopupOptions = { ...popupDefaultOptions, ...(popupOptions || {}) };
    const left: number = this.windowInternal.screenLeft + (this.windowInternal.outerWidth - options.width) / 2;
    const top: number = this.windowInternal.screenTop + (this.windowInternal.outerHeight - options.height) / 2;

    options.left = left;
    options.top = top;

    return Object.entries(options)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join(',');
  }

  private canAccessSessionStorage(): boolean {
    return typeof navigator !== 'undefined' && navigator.cookieEnabled && typeof Storage !== 'undefined';
  }
}
