import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CallbackContext } from '../flows/callback-context';

@Injectable()
export class SilentRenewServiceMock {
    private refreshSessionWithIFrameCompletedInternal$ = new Subject<CallbackContext>();
    get refreshSessionWithIFrameCompleted$() {
        return this.refreshSessionWithIFrameCompletedInternal$.asObservable();
    }

    getOrCreateIframe(): HTMLIFrameElement {
        return null;
    }

    isSilentRenewConfigured() {
        return true;
    }

    codeFlowCallbackSilentRenewIframe(urlParts) {}

    silentRenewEventHandler(e: CustomEvent) {}

    fireRefreshWithIframeCompleted(callbackContext: CallbackContext) {
        this.refreshSessionWithIFrameCompletedInternal$.next(callbackContext);
        this.refreshSessionWithIFrameCompletedInternal$.complete();
    }

    getExistingIframe() {}
}
