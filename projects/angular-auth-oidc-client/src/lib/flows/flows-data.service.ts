import { Injectable } from '@angular/core';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { RandomService } from './random/random.service';

@Injectable()
export class FlowsDataService {
    constructor(private storagePersistanceService: StoragePersistanceService, private randomService: RandomService) {}

    createNonce(): string {
        const nonce = this.randomService.createRandom(40);
        this.setNonce(nonce);
        return nonce;
    }

    setNonce(nonce: string) {
        this.storagePersistanceService.write('authNonce', nonce);
    }

    getAuthStateControl(): any {
        return this.storagePersistanceService.read('authStateControl');
    }

    setAuthStateControl(authStateControl: string) {
        this.storagePersistanceService.write('authStateControl', authStateControl);
    }

    getExistingOrCreateAuthStateControl(): any {
        let state = this.storagePersistanceService.read('authStateControl');
        if (!state) {
            state = this.randomService.createRandom(40);
            this.storagePersistanceService.write('authStateControl', state);
        }
        return state;
    }

    setSessionState(sessionState: any) {
        this.storagePersistanceService.write('session_state', sessionState);
    }

    resetStorageFlowData() {
        this.storagePersistanceService.resetStorageFlowData();
    }

    getCodeVerifier() {
        return this.storagePersistanceService.read('codeVerifier');
    }

    createCodeVerifier() {
        const codeVerifier = this.randomService.createRandom(67);
        this.storagePersistanceService.write('codeVerifier', codeVerifier);
        return codeVerifier;
    }

    isSilentRenewRunning() {
        return this.storagePersistanceService.read('storageSilentRenewRunning') === 'running';
    }

    setSilentRenewRunning() {
        this.storagePersistanceService.write('storageSilentRenewRunning', 'running');
    }

    resetSilentRenewRunning() {
        this.storagePersistanceService.write('storageSilentRenewRunning', '');
    }
}
