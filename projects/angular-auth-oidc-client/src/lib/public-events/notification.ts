import { EventTypes } from './event-types';

export interface OidcClientNotification<T> {
    type: EventTypes;
    value?: T;
}
