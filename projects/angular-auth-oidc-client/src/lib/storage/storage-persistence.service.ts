import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from './abstract-security-storage';

export type StorageKeys =
  | 'authnResult'
  | 'authzData'
  | 'access_token_expires_at'
  | 'authWellKnownEndPoints'
  | 'userData'
  | 'authNonce'
  | 'codeVerifier'
  | 'authStateControl'
  | 'session_state'
  | 'storageSilentRenewRunning'
  | 'storageCustomRequestParams'
  | 'jwtKeys'
  | 'redirect'
  | 'configIds';

@Injectable()
export class StoragePersistenceService {
  constructor(private readonly oidcSecurityStorage: AbstractSecurityStorage) {}

  read(key: StorageKeys, configId: string): any {
    const storedConfig = this.oidcSecurityStorage.read(configId) || {};

    return storedConfig[key];
  }

  write(key: StorageKeys, value: any, configId: string): void {
    const storedConfig = this.oidcSecurityStorage.read(configId) || {};

    storedConfig[key] = value;
    this.oidcSecurityStorage.write(configId, storedConfig);
  }

  remove(key: StorageKeys, configId: string): void {
    const storedConfig = this.oidcSecurityStorage.read(configId) || {};

    delete storedConfig[key];

    this.oidcSecurityStorage.write(configId, storedConfig);
  }

  clear(): void {
    this.oidcSecurityStorage.clear();
  }

  resetStorageFlowData(configId: string): void {
    this.remove('session_state', configId);
    this.remove('storageSilentRenewRunning', configId);
    this.remove('codeVerifier', configId);
    this.remove('userData', configId);
    this.remove('storageCustomRequestParams', configId);
    this.remove('access_token_expires_at', configId);
  }

  resetAuthStateInStorage(configId: string): void {
    this.remove('authzData', configId);
    this.remove('authnResult', configId);
  }

  getAccessToken(configId: string): string {
    return this.read('authzData', configId);
  }

  getIdToken(configId: string): string {
    return this.read('authnResult', configId)?.id_token;
  }

  getRefreshToken(configId: string): string {
    return this.read('authnResult', configId)?.refresh_token;
  }
}
