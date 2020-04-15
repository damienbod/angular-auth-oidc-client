import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { EventTypes } from './event-types';
import { OidcClientNotification } from './notification';

@Injectable({ providedIn: 'root' })
export class EventsService {
    private notify = new ReplaySubject<OidcClientNotification>(1);

    fireEvent(type: EventTypes, value: any) {
        this.notify.next({ type, value });
    }

    registerForEvents() {
        return this.notify.asObservable();
    }
}
