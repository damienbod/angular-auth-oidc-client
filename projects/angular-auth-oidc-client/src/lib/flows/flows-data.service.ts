import { Injectable } from '@angular/core';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { OpenIdConfiguration } from './../config/openid-configuration';
import { RandomService } from './random/random.service';

@Injectable()
export class FlowsDataService {
  constructor(
    private readonly storagePersistenceService: StoragePersistenceService,
    private readonly randomService: RandomService,
    private readonly loggerService: LoggerService
  ) {}

  createNonce(configuration: OpenIdConfiguration): string {
    const nonce = this.randomService.createRandom(40, configuration);

    this.loggerService.logDebug(configuration, 'Nonce created. nonce:' + nonce);
    this.setNonce(nonce, configuration);

    return nonce;
  }

  setNonce(nonce: string, configuration: OpenIdConfiguration): void {
    this.storagePersistenceService.write('authNonce', nonce, configuration);
  }

  getAuthStateControl(configuration: OpenIdConfiguration): any {
    return this.storagePersistenceService.read('authStateControl', configuration);
  }

  setAuthStateControl(authStateControl: string, configuration: OpenIdConfiguration): boolean {
    return this.storagePersistenceService.write('authStateControl', authStateControl, configuration);
  }

  getExistingOrCreateAuthStateControl(configuration: OpenIdConfiguration): any {
    let state = this.storagePersistenceService.read('authStateControl', configuration);

    if (!state) {
      state = this.randomService.createRandom(40, configuration);
      this.storagePersistenceService.write('authStateControl', state, configuration);
    }

    return state;
  }

  setSessionState(sessionState: any, configuration: OpenIdConfiguration): void {
    this.storagePersistenceService.write('session_state', sessionState, configuration);
  }

  resetStorageFlowData(configuration: OpenIdConfiguration): void {
    this.storagePersistenceService.resetStorageFlowData(configuration);
  }

  getCodeVerifier(configuration: OpenIdConfiguration): any {
    return this.storagePersistenceService.read('codeVerifier', configuration);
  }

  createCodeVerifier(configuration: OpenIdConfiguration): string {
    const codeVerifier = this.randomService.createRandom(67, configuration);

    this.storagePersistenceService.write('codeVerifier', codeVerifier, configuration);

    return codeVerifier;
  }

  isCodeFlowInProgress(configuration: OpenIdConfiguration): boolean {
    const storageObject = this.getCodeFlowInProgressStorageEntry(configuration);

    if (!storageObject) {
      return false;
    }

    return storageObject.state === 'in progress';
  }

  setCodeFlowInProgress(configuration: OpenIdConfiguration): void {
    const storageObject = {
      state: 'in progress',
    };

    this.storagePersistenceService.write('storageCodeFlowInProgress', JSON.stringify(storageObject), configuration);
  }

  resetCodeFlowInProgress(configuration: OpenIdConfiguration): void {
    this.storagePersistenceService.write('storageCodeFlowInProgress', '', configuration);
  }

  private getCodeFlowInProgressStorageEntry(configuration: OpenIdConfiguration): any {
    const storageEntry = this.storagePersistenceService.read('storageCodeFlowInProgress', configuration);

    if (!storageEntry) {
      return null;
    }

    return JSON.parse(storageEntry);
  }

  isSilentRenewRunning(configuration: OpenIdConfiguration): boolean {
    const { configId, silentRenewTimeoutInSeconds } = configuration;
    const storageObject = this.getSilentRenewRunningStorageEntry(configuration);

    if (!storageObject) {
      return false;
    }

    const timeOutInMilliseconds = silentRenewTimeoutInSeconds * 1000;
    const dateOfLaunchedProcessUtc = Date.parse(storageObject.dateOfLaunchedProcessUtc);
    const currentDateUtc = Date.parse(new Date().toISOString());
    const elapsedTimeInMilliseconds = Math.abs(currentDateUtc - dateOfLaunchedProcessUtc);
    const isProbablyStuck = elapsedTimeInMilliseconds > timeOutInMilliseconds;

    if (isProbablyStuck) {
      this.loggerService.logDebug(configuration, 'silent renew process is probably stuck, state will be reset.', configId);
      this.resetSilentRenewRunning(configuration);

      return false;
    }

    return storageObject.state === 'running';
  }

  setSilentRenewRunning(configuration: OpenIdConfiguration): void {
    const storageObject = {
      state: 'running',
      dateOfLaunchedProcessUtc: new Date().toISOString(),
    };

    this.storagePersistenceService.write('storageSilentRenewRunning', JSON.stringify(storageObject), configuration);
  }

  resetSilentRenewRunning(configuration: OpenIdConfiguration): void {
    this.storagePersistenceService.write('storageSilentRenewRunning', '', configuration);
  }

  private getSilentRenewRunningStorageEntry(configuration: OpenIdConfiguration): any {
    const storageEntry = this.storagePersistenceService.read('storageSilentRenewRunning', configuration);

    if (!storageEntry) {
      return null;
    }

    return JSON.parse(storageEntry);
  }
}
