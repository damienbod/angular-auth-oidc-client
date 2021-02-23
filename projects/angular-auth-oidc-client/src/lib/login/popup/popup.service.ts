import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PopupOptions } from './popup-options';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private popUp: Window;
  private receivedUrlInternal$ = new Subject<string>();

  get receivedUrl$(): Observable<string> {
    return this.receivedUrlInternal$.asObservable();
  }

  isCurrentlyInPopup(): boolean {
    return !!window.opener && window.opener !== window;
  }

  openPopUp(url: string, popupOptions?: PopupOptions): void {
    const optionsToPass = this.getOptions(popupOptions);
    this.popUp = window.open(url, '_blank', optionsToPass);

    const listener = (event: MessageEvent): void => {
      if (!event?.data || typeof event.data !== 'string') {
        return;
      }

      this.receivedUrlInternal$.next(event.data);

      this.cleanUp(listener);
    };

    window.addEventListener('message', listener, false);
  }

  sendMessageToMainWindow(url: string): void {
    if (window.opener) {
      this.sendMessage(url, window.location.href);
    }
  }

  private cleanUp(listener: any): void {
    window.removeEventListener('message', listener, false);

    if (this.popUp) {
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
