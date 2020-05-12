import { Injectable } from '@angular/core';

const IFRAME_FOR_CHECK_SESSION_IDENTIFIER = 'myiFrameForCheckSession';

// http://openid.net/specs/openid-connect-session-1_0-ID4.html

@Injectable()
export class CheckSessionServiceMock {
    get checkSessionChanged$() {
        return null;
    }

    isCheckSessionConfigured() {
        return false;
    }

    start(): void {}

    stop(): void {}

    serverStateChanged() {
        return false;
    }

    getExistingIframe() {
        return null;
    }
}
