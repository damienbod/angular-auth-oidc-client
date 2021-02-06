import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private popUp: Window;

  private receivedUrlInternal$ = new Subject();

  get receivedUrl$() {
    return this.receivedUrlInternal$.asObservable();
  }

  constructor() {}

  hasPopup() {
    return window.opener && window.opener !== window;
  }

  openPopUp(url: string) {
    const options = `width=500,height=500,left=50,top=50`;
    this.popUp = window.open(url, '_blank', options);

    const listener = (event: MessageEvent) => {
      // console.log('event', event);
      // console.log('event.origin', event.origin);
      // console.log('current href', window.location.href);

      this.receivedUrlInternal$.next(event.data);

      this.cleanUp(listener);
    };

    window.addEventListener('message', listener, false);
  }

  sendMessageToMainWindow(url: string) {
    try {
      this.trySendMessage(window?.opener, url, window.location.href);
    } catch (error) {
      console.error(error);
    }
  }

  private cleanUp(listener: any) {
    window.removeEventListener('message', listener, false);

    if (this.popUp) {
      this.popUp.close();
      this.popUp = null;
    }
  }

  private trySendMessage(targetWindow: any, url: string, origin: string) {
    if (targetWindow) {
      targetWindow.postMessage(url, origin);
    }
  }
}
