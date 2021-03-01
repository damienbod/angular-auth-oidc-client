import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { RandomService } from './random/random.service';

@Injectable()
export class FlowsDataService {
  constructor(
    private storagePersistanceService: StoragePersistanceService,
    private randomService: RandomService,
    private configurationProvider: ConfigurationProvider,
    private loggerService: LoggerService
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

    if (storageObject) {
      const { silentRenewTimeoutInSeconds } = this.configurationProvider.getOpenIDConfiguration();
      const timeOutInMilliseconds = silentRenewTimeoutInSeconds * 1000;
      const dateOfLaunchedProcessUtc = Date.parse(storageObject.dateOfLaunchedProcessUtc);
      const currentDateUtc = Date.parse(new Date().toISOString());
      const elapsedTimeInMilliseconds = Math.abs(currentDateUtc - dateOfLaunchedProcessUtc);
      const isProbablyStuck = elapsedTimeInMilliseconds > timeOutInMilliseconds;

      if (isProbablyStuck) {
        this.loggerService.logDebug('silent renew process is probably stuck, state will be reset.');
        this.resetSilentRenewRunning();
        return false;
      }

      return storageObject.state === 'running';
    }

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
