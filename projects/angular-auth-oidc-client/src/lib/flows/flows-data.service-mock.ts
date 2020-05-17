import { Injectable } from '@angular/core';

@Injectable()
export class FlowsDataServiceMock {
    createNonce(): string {
        return '';
    }

    setNonce(nonce: string) {}

    getAuthStateControl(): any {}
    setAuthStateControl(authStateControl: string) {}

    getExistingOrCreateAuthStateControl(): any {
        return null;
    }

    setSessionState(sessionState: any) {}

    resetStorageFlowData() {}

    getCodeVerifier() {}

    createCodeVerifier() {
        return '';
    }

    isSilentRenewRunning() {
        return true;
    }

    setSilentRenewRunning() {}
    resetSilentRenewRunning() {}
}
