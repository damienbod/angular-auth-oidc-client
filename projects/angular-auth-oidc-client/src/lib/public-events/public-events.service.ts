import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { EventTypes } from './event-types';
import { OidcClientNotification } from './notification';

@Injectable()
export class PublicEventsService {
    private notify = new ReplaySubject<OidcClientNotification<any>>(1);

    fireEvent<T>(type: EventTypes, value?: T) {
        this.notify.next({ type, value });
    }

    registerForEvents() {
        return this.notify.asObservable();
    }
}
