import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { RandomService } from './random/random.service';

@Injectable()
export class FlowsDataService {
  constructor(
    private storagePersistenceService: StoragePersistenceService,
    private randomService: RandomService,
    private configurationProvider: ConfigurationProvider,
    private loggerService: LoggerService
  ) {}

  createNonce(configId: string): string {
    const nonce = this.randomService.createRandom(40, configId);
    this.setNonce(nonce, configId);
    return nonce;
  }

  setNonce(nonce: string, configId: string) {
    this.storagePersistenceService.write('authNonce', nonce, configId);
  }

  getAuthStateControl(configId: string): any {
    return this.storagePersistenceService.read('authStateControl', configId);
  }

  setAuthStateControl(authStateControl: string, configId: string) {
    this.storagePersistenceService.write('authStateControl', authStateControl, configId);
  }

  getExistingOrCreateAuthStateControl(configId: string): any {
    let state = this.storagePersistenceService.read('authStateControl', configId);
    if (!state) {
      state = this.randomService.createRandom(40, configId);
      this.storagePersistenceService.write('authStateControl', state, configId);
    }
    return state;
  }

  setSessionState(sessionState: any, configId: string) {
    this.storagePersistenceService.write('session_state', sessionState, configId);
  }

  resetStorageFlowData(configId: string) {
    this.storagePersistenceService.resetStorageFlowData(configId);
  }

  getCodeVerifier(configId: string) {
    return this.storagePersistenceService.read('codeVerifier', configId);
  }

  createCodeVerifier(configId: string) {
    const codeVerifier = this.randomService.createRandom(67, configId);
    this.storagePersistenceService.write('codeVerifier', codeVerifier, configId);
    return codeVerifier;
  }

  isSilentRenewRunning(configId: string) {
    const storageObject = this.getSilentRenewRunningStorageEntry(configId);

    if (!storageObject) {
      return false;
    }

    const { silentRenewTimeoutInSeconds } = this.configurationProvider.getOpenIDConfiguration(configId);
    const timeOutInMilliseconds = silentRenewTimeoutInSeconds * 1000;
    const dateOfLaunchedProcessUtc = Date.parse(storageObject.dateOfLaunchedProcessUtc);
    const currentDateUtc = Date.parse(new Date().toISOString());
    const elapsedTimeInMilliseconds = Math.abs(currentDateUtc - dateOfLaunchedProcessUtc);
    const isProbablyStuck = elapsedTimeInMilliseconds > timeOutInMilliseconds;

    if (isProbablyStuck) {
      this.loggerService.logDebug(configId, 'silent renew process is probably stuck, state will be reset.', configId);
      this.resetSilentRenewRunning(configId);
      return false;
    }

    return storageObject.state === 'running';
  }

  setSilentRenewRunning(configId: string) {
    const storageObject = {
      state: 'running',
      dateOfLaunchedProcessUtc: new Date().toISOString(),
    };

    this.storagePersistenceService.write('storageSilentRenewRunning', JSON.stringify(storageObject), configId);
  }

  resetSilentRenewRunning(configId: string) {
    this.storagePersistenceService.write('storageSilentRenewRunning', '', configId);
  }

  private getSilentRenewRunningStorageEntry(configId: string): any {
    const storageEntry = this.storagePersistenceService.read('storageSilentRenewRunning', configId);

    if (!storageEntry) {
      return null;
    }

    return JSON.parse(storageEntry);
  }
}
