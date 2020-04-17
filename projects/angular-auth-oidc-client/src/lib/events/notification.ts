import { EventTypes } from './event-types';

export interface OidcClientNotification {
    type: EventTypes;
    value?: any;
}
