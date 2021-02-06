import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { PopupOptions } from './popup-options';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private popUp: Window;
  private receivedUrlInternal$ = new Subject();

  get receivedUrl$() {
    return this.receivedUrlInternal$.asObservable();
  }

  hasPopup() {
    return window.opener && window.opener !== window;
  }

  openPopUp(url: string, popupOptions?: PopupOptions) {
    const popupDefaultOptions = {
      width: 500,
      height: 500,
      left: 50,
      top: 50,
    };

    const options = { ...popupDefaultOptions, ...(popupOptions || {}) };

    const optionsToPass = Object.entries(options)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join(',');

    this.popUp = window.open(url, '_blank', optionsToPass);

    const listener = (event: MessageEvent) => {
      if (!event?.data || typeof event.data !== 'string') {
        return;
      }

      this.receivedUrlInternal$.next(event.data);

      this.cleanUp(listener);
    };

    window.addEventListener('message', listener, false);
  }

  sendMessageToMainWindow(url: string) {
    if (window?.opener) {
      window?.opener.postMessage(url, window.location.href);
    }
  }

  private cleanUp(listener: any) {
    window.removeEventListener('message', listener, false);

    if (this.popUp) {
      this.popUp.close();
      this.popUp = null;
    }
  }
}
