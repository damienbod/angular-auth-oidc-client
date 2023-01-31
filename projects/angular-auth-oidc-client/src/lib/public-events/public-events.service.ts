import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { EventTypes } from './event-types';
import { OidcClientNotification } from './notification';

@Injectable({ providedIn: 'root' })
export class PublicEventsService {
  private readonly notify = new ReplaySubject<OidcClientNotification<any>>(1);

  /**
   * Fires a new event.
   *
   * @param type The event type.
   * @param value The event value.
   */
  fireEvent<T>(type: EventTypes, value?: T): void {
    this.notify.next({ type, value });
  }

  /**
   * Wires up the event notification observable.
   */
  registerForEvents(): Observable<OidcClientNotification<any>> {
    return this.notify.asObservable();
  }
}
