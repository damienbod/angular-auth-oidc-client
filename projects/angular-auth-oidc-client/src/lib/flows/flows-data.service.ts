import { Injectable } from '@angular/core';
import { StoragePersistanceService } from '../storage';
import { RandomService } from './random/random.service';

@Injectable()
export class FlowsDataService {
    constructor(private storagePersistanceService: StoragePersistanceService, private readonly randomService: RandomService) {}

    createNonce(): string {
        const nonce = this.randomService.createRandom(40);
        this.setNonce(nonce);
        return nonce;
    }

    setNonce(nonce: string) {
        this.storagePersistanceService.authNonce = nonce;
    }

    getAuthStateControl(): any {
        return this.storagePersistanceService.authStateControl;
    }
    setAuthStateControl(authStateControl: string) {
        this.storagePersistanceService.authStateControl = authStateControl;
    }

    getExistingOrCreateAuthStateControl(): any {
        let state = this.storagePersistanceService.authStateControl;
        if (!state) {
            state = this.randomService.createRandom(40);
            this.storagePersistanceService.authStateControl = state;
        }
        return state;
    }

    setSessionState(sessionState: any) {
        this.storagePersistanceService.sessionState = sessionState;
    }

    resetStorageFlowData() {
        this.storagePersistanceService.resetStorageFlowData();
    }

    getCodeVerifier() {
        return this.storagePersistanceService.codeVerifier;
    }

    createCodeVerifier() {
        const codeVerifier = this.randomService.createRandom(67);
        this.storagePersistanceService.codeVerifier = codeVerifier;
        return codeVerifier;
    }

    isSilentRenewRunning() {
        return this.storagePersistanceService.silentRenewRunning === 'running';
    }

    setSilentRenewRunning() {
        this.storagePersistanceService.silentRenewRunning = 'running';
    }
    resetSilentRenewRunning() {
        this.storagePersistanceService.silentRenewRunning = '';
    }
}
