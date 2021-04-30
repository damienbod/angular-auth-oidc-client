import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { EventTypes } from './event-types';
import { OidcClientNotification } from './notification';

@Injectable()
export class PublicEventsService {
  private notify = new ReplaySubject<OidcClientNotification<any>>(1);

  /**
   * Fires a new event.
   *
   * @param type The event type.
   * @param value The event value.
   */
  fireEvent<T>(type: EventTypes, value?: T) {
    this.notify.next({ type, value });
  }

  /**
   * Wires up the event notification observable.
   */
  registerForEvents() {
    return this.notify.asObservable();
  }
}
