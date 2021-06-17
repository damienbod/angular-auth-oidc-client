import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PopupOptions } from './popup-options';
import { PopupResult } from './popup-result';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private STORAGE_IDENTIFIER = 'popupauth';
  private popUp: Window;
  private handle: number;
  private resultInternal$ = new Subject<PopupResult>();

  get result$(): Observable<PopupResult> {
    return this.resultInternal$.asObservable();
  }

  isCurrentlyInPopup(): boolean {
    const popup = sessionStorage.getItem(this.STORAGE_IDENTIFIER);

    return !!window.opener && window.opener !== window && !!popup;
  }

  openPopUp(url: string, popupOptions?: PopupOptions): void {
    const optionsToPass = this.getOptions(popupOptions);
    this.popUp = window.open(url, '_blank', optionsToPass);
    this.popUp.sessionStorage.setItem(this.STORAGE_IDENTIFIER, 'true');

    const listener = (event: MessageEvent): void => {
      if (!event?.data || typeof event.data !== 'string') {
        return;
      }

      this.resultInternal$.next({ userClosed: false, receivedUrl: event.data });

      this.cleanUp(listener);
    };

    window.addEventListener('message', listener, false);

    this.handle = window.setInterval(() => {
      if (this.popUp.closed) {
        this.resultInternal$.next({ userClosed: true });

        this.cleanUp(listener);
      }
    }, 200);
  }

  sendMessageToMainWindow(url: string): void {
    if (window.opener) {
      this.sendMessage(url, window.location.href);
    }
  }

  private cleanUp(listener: any): void {
    window.removeEventListener('message', listener, false);

    window.clearInterval(this.handle);

    if (this.popUp) {
      this.popUp.sessionStorage?.removeItem(this.STORAGE_IDENTIFIER);
      this.popUp.close();
      this.popUp = null;
    }
  }

  private sendMessage(url: string, href: string): void {
    window.opener.postMessage(url, href);
  }

  private getOptions(popupOptions?: PopupOptions): string {
    const popupDefaultOptions = { width: 500, height: 500, left: 50, top: 50 };

    const options = { ...popupDefaultOptions, ...(popupOptions || {}) };

    return Object.entries(options)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join(',');
  }
}
