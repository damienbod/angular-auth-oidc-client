import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { RandomService } from './random/random.service';

@Injectable()
export class FlowsDataService {
    constructor(
        private storagePersistanceService: StoragePersistanceService,
        private randomService: RandomService,
        private configurationProvider: ConfigurationProvider
    ) {}

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
        const storageObject = JSON.parse(this.storagePersistanceService.read('storageSilentRenewRunning'));
        console.log('isSilentRenewRunning storageObject =>>', storageObject);
        if (storageObject) {
            const dateOfLaunchedProcessUtc = Date.parse(storageObject.dateOfLaunchedProcessUtc);
            console.log('isSilentRenewRunning dateOfLaunchedProcessUtc =>>', dateOfLaunchedProcessUtc);
            const currentDateUtc = Date.parse(new Date().toISOString());
            console.log('isSilentRenewRunning currentDateUtc =>>', currentDateUtc);
            const elapsedTimeInMilliseconds = Math.abs(currentDateUtc - dateOfLaunchedProcessUtc);
            console.log('isSilentRenewRunning elapsedTimeInMilliseconds =>>', elapsedTimeInMilliseconds);

            const isProbablyStuck =
                elapsedTimeInMilliseconds > this.configurationProvider.openIDConfiguration.silentRenewTimeoutInSeconds * 1000;

            console.log('isSilentRenewRunning isProbablyStuck =>>', isProbablyStuck);

            if (isProbablyStuck) {
                console.log('isSilentRenewRunning INSIDE isProbablyStuck');
                this.resetSilentRenewRunning();
                return false;
            }

            console.log('isSilentRenewRunning AFTER isProbablyStuck CHECK, storageObject.state =>>', storageObject.state);
            console.log('isSilentRenewRunning AFTER isProbablyStuck CHECK, return  =>>', storageObject.state === 'running');
            return storageObject.state === 'running';
        }

        console.log('isSilentRenewRunning return FALSE');

        return false;
    }

    setSilentRenewRunning() {
        const storageObject = {
            state: 'running',
            dateOfLaunchedProcessUtc: new Date().toISOString(),
        };

        this.storagePersistanceService.write('storageSilentRenewRunning', JSON.stringify(storageObject));
    }

    resetSilentRenewRunning() {
        this.storagePersistanceService.write('storageSilentRenewRunning', '');
    }
}
