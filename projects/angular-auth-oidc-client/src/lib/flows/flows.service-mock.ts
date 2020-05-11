import { Injectable } from '@angular/core';
import { CallbackContext } from './callback-context';

@Injectable()
export class FlowsServiceMock {
    resetAuthorizationData(): void {}

    processCodeFlowCallback(urlToCheck: string) {}

    processSilentRenewCodeFlowCallback(firstContext: CallbackContext) {}

    processImplicitFlowCallback(hash?: string) {}

    processRefreshToken() {}
}
