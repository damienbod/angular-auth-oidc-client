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
  | 'jwtKeys'
  | 'redirect';

@Injectable()
export class StoragePersistenceService {
  constructor(
    private readonly oidcSecurityStorage: AbstractSecurityStorage,
    private readonly configurationProvider: ConfigurationProvider
  ) {}

  getExistingConfigId(clientId: string): string {
    const config = JSON.parse(sessionStorage.getItem(clientId) || null);

    if (!config) {
      return null;
    }

    return Object.keys(config)[0];
  }

  read(key: StorageKeys, configId: string): any {
    const { clientId } = this.configurationProvider.getOpenIDConfiguration(configId);
    const clientsConfigs = this.oidcSecurityStorage.read(clientId) || {};
    const config = clientsConfigs[configId] || {};

    return config[key];
  }

  write(key: StorageKeys, value: any, configId: string): void {
    const { clientId } = this.configurationProvider.getOpenIDConfiguration(configId);
    const clientsConfigs = this.oidcSecurityStorage.read(clientId) || {};
    const config = clientsConfigs[configId];

    if (!!config) {
      config[key] = value;
      this.oidcSecurityStorage.write(clientId, clientsConfigs);
    } else {
      const newConfig = this.createConfig(configId);
      newConfig[configId][key] = value;
      this.oidcSecurityStorage.write(clientId, newConfig);
    }
  }

  remove(key: StorageKeys, configId: string): void {
    const { clientId } = this.configurationProvider.getOpenIDConfiguration(configId);
    const clientsConfigs = this.oidcSecurityStorage.read(clientId) || {};
    const config = clientsConfigs[configId] || {};
    delete config[key];

    this.oidcSecurityStorage.write(clientId, config);
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

  private createConfig(configId: string) {
    const toReturn = {};
    toReturn[configId] = {};

    return toReturn;
  }
}
