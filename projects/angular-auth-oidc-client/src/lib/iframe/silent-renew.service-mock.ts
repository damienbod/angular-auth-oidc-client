import { Injectable } from '@angular/core';

@Injectable()
export class SilentRenewServiceMock {
    getOrCreateIframe(): HTMLIFrameElement {
        return null;
    }

    isSilentRenewConfigured() {
        return true;
    }
}
