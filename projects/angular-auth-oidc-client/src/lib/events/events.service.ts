import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { EventTypes } from './event-types';

@Injectable({ providedIn: 'root' })
export class EventsService {
    private registeredEvents = [];
    private notify = new Subject<any>();

    fireEvent(type: EventTypes, data: any) {
        if (this.registeredEvents.includes(type)) {
            this.notify.next(data);
        }
    }

    registerFor(events: EventTypes[] | EventTypes) {
        this.registeredEvents = Array.isArray(events) ? events : [events];
        return this.notify.asObservable();
    }
}
