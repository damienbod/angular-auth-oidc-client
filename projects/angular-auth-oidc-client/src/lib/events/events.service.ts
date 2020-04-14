import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { EventTypes } from './event-types';

@Injectable({ providedIn: 'root' })
export class EventsService {
    private notify = new Subject<Notification>();

    constructor() {
        console.log('@@@@ new Instance');
    }
    fireEvent(type: EventTypes, value: any) {
        this.notify.next({ type, value });
    }

    registerForEvents() {
        return this.notify.asObservable();
    }
}

export interface Notification {
    type: EventTypes;
    value: any;
}
