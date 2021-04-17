import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
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
  | 'jwtKeys';

@Injectable()
export class StoragePersistanceService {
  constructor(
    private readonly oidcSecurityStorage: AbstractSecurityStorage,
    private readonly configurationProvider: ConfigurationProvider
  ) {}

  read(key: StorageKeys) {
    const keyToRead = this.createKeyWithPrefix(key);
    return this.oidcSecurityStorage.read(keyToRead);
  }

  write(key: StorageKeys, value: any) {
    const keyToStore = this.createKeyWithPrefix(key);
    this.oidcSecurityStorage.write(keyToStore, value);
  }

  remove(key: StorageKeys) {
    const keyToStore = this.createKeyWithPrefix(key);
    this.oidcSecurityStorage.remove(keyToStore);
  }

  resetStorageFlowData() {
    this.remove('session_state');
    this.remove('storageSilentRenewRunning');
    this.remove('codeVerifier');
    this.remove('userData');
    this.remove('storageCustomRequestParams');
    this.remove('access_token_expires_at');
  }

  resetAuthStateInStorage() {
    this.remove('authzData');
    this.remove('authnResult');
  }

  getAccessToken(): any {
    return this.read('authzData');
  }

  getIdToken(): any {
    return this.read('authnResult')?.id_token;
  }

  getRefreshToken(): any {
    return this.read('authnResult')?.refresh_token;
  }

  private createKeyWithPrefix(key: string) {
    const config = this.configurationProvider.getOpenIDConfiguration();
    const prefix = config?.clientId || '';
    return `${prefix}_${key}`;
  }
}
