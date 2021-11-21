import { Injectable } from '@angular/core';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { OpenIdConfiguration } from './../config/openid-configuration';
import { RandomService } from './random/random.service';

@Injectable()
export class FlowsDataService {
  constructor(
    private storagePersistenceService: StoragePersistenceService,
    private randomService: RandomService,
    private loggerService: LoggerService
  ) {}

  createNonce(configId: string): string {
    const nonce = this.randomService.createRandom(40, configId);
    this.loggerService.logDebug(configId, 'Nonce created. nonce:' + nonce);
    this.setNonce(nonce, configId);

    return nonce;
  }

  setNonce(nonce: string, configId: string): void {
    this.storagePersistenceService.write('authNonce', nonce, configId);
  }

  getAuthStateControl(configId: string): any {
    return this.storagePersistenceService.read('authStateControl', configId);
  }

  setAuthStateControl(authStateControl: string, configId: string): boolean {
    return this.storagePersistenceService.write('authStateControl', authStateControl, configId);
  }

  getExistingOrCreateAuthStateControl(configId: string): any {
    let state = this.storagePersistenceService.read('authStateControl', configId);
    if (!state) {
      state = this.randomService.createRandom(40, configId);
      this.storagePersistenceService.write('authStateControl', state, configId);
    }

    return state;
  }

  setSessionState(sessionState: any, configId: string): void {
    this.storagePersistenceService.write('session_state', sessionState, configId);
  }

  resetStorageFlowData(configId: string): void {
    this.storagePersistenceService.resetStorageFlowData(configId);
  }

  getCodeVerifier(configId: string): any {
    return this.storagePersistenceService.read('codeVerifier', configId);
  }

  createCodeVerifier(configId: string): string {
    const codeVerifier = this.randomService.createRandom(67, configId);
    this.storagePersistenceService.write('codeVerifier', codeVerifier, configId);

    return codeVerifier;
  }

  isSilentRenewRunning(configuration: OpenIdConfiguration): boolean {
    const { configId, silentRenewTimeoutInSeconds } = configuration;
    const storageObject = this.getSilentRenewRunningStorageEntry(configId);

    if (!storageObject) {
      return false;
    }

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

  setSilentRenewRunning(configId: string): void {
    const storageObject = {
      state: 'running',
      dateOfLaunchedProcessUtc: new Date().toISOString(),
    };

    this.storagePersistenceService.write('storageSilentRenewRunning', JSON.stringify(storageObject), configId);
  }

  resetSilentRenewRunning(configId: string): void {
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
