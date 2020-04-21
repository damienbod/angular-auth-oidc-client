import { Injectable } from '@angular/core';
import { RandomService } from 'dist/angular-auth-oidc-client/lib/utils';
import { ConfigurationProvider } from '../config';
import { StoragePersistanceService } from '../storage';

@Injectable()
export class FlowsService {
    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly randomService: RandomService
    ) {}
    getSessionState(): any {
        return this.storagePersistanceService.sessionState;
    }

    getNonce(): string {
        return this.storagePersistanceService.authNonce;
    }

    createNonce(): string {
        const nonce = this.randomService.createRandom(40);
        this.storagePersistanceService.authNonce = nonce;
        return nonce;
    }

    getAuthStateControl(): any {
        return this.storagePersistanceService.authStateControl;
    }

    getExistingOrCreateAuthStateControl(): any {
        let state = this.storagePersistanceService.authStateControl;
        if (!state) {
            state = this.randomService.createRandom(40);
            this.storagePersistanceService.authStateControl = state;
        }
    }

    setSessionState(sessionState: any) {
        this.storagePersistanceService.sessionState = sessionState;
    }

    setNonce(nonce: string) {
        this.storagePersistanceService.authNonce = nonce;
    }

    setAuthStateControl(authStateControl: string) {
        this.storagePersistanceService.authStateControl = authStateControl;
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
}
