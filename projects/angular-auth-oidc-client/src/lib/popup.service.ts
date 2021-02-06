import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private modal: Window;

  private hasResultInternal$ = new Subject();

  get hasResult$() {
    return this.hasResultInternal$.asObservable();
  }

  constructor() {}

  openPopUp(url: string) {
    const options = `width=500,height=500,left=50,top=50`;
    this.modal = window.open(url, '_blank', options);

    const listener = (event: MessageEvent) => {
      // console.log('event', event);
      // console.log('event.origin', event.origin);
      // console.log('current href', window.location.href);

      this.hasResultInternal$.next(event.data);

      this.cleanUp(listener);
    };

    window.addEventListener('message', listener, false);
  }

  sendMessageToMainWindow(messageObj: any) {
    try {
      this.trySendMessage(window?.opener, messageObj, window.location.href);
    } catch (error) {
      console.error(error);
    }
  }

  private cleanUp(listener: any) {
    window.removeEventListener('message', listener, false);

    if (this.modal) {
      this.modal.close();
      this.modal = null;
    }
  }

  private trySendMessage(targetWindow: any, messageObj: boolean, origin: string) {
    if (targetWindow) {
      targetWindow.postMessage(messageObj, origin);
    }
  }
}
