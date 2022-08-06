import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from './../config/openid-configuration';
import { BrowserStorageService } from './browser-storage.service';

export type StorageKeys =
  | 'authnResult'
  | 'authzData'
  | 'access_token_expires_at'
  | 'authWellKnownEndPoints'
  | 'userData'
  | 'authNonce'
  | 'codeVerifier'
  | 'authStateControl'
  | 'reusable_refresh_token'
  | 'session_state'
  | 'storageSilentRenewRunning'
  | 'storageCodeFlowInProgress'
  | 'storageCustomParamsAuthRequest'
  | 'storageCustomParamsRefresh'
  | 'storageCustomParamsEndSession'
  | 'redirect'
  | 'configIds'
  | 'jwtKeys';

@Injectable()
export class StoragePersistenceService {
  constructor(private readonly browserStorageService: BrowserStorageService) {}

  read(key: StorageKeys, config: OpenIdConfiguration): any {
    const storedConfig = this.browserStorageService.read(key, config) || {};

    return storedConfig[key];
  }

  write(key: StorageKeys, value: any, config: OpenIdConfiguration): boolean {
    const storedConfig = this.browserStorageService.read(key, config) || {};

    storedConfig[key] = value;

    return this.browserStorageService.write(storedConfig, config);
  }

  remove(key: StorageKeys, config: OpenIdConfiguration): void {
    const storedConfig = this.browserStorageService.read(key, config) || {};

    delete storedConfig[key];

    this.browserStorageService.write(storedConfig, config);
  }

  clear(config: OpenIdConfiguration): void {
    this.browserStorageService.clear(config);
  }

  resetStorageFlowData(config: OpenIdConfiguration): void {
    this.remove('session_state', config);
    this.remove('storageSilentRenewRunning', config);
    this.remove('storageCodeFlowInProgress', config);
    this.remove('codeVerifier', config);
    this.remove('userData', config);
    this.remove('storageCustomParamsAuthRequest', config);
    this.remove('access_token_expires_at', config);
    this.remove('storageCustomParamsRefresh', config);
    this.remove('storageCustomParamsEndSession', config);
    this.remove('reusable_refresh_token', config);
  }

  resetAuthStateInStorage(config: OpenIdConfiguration): void {
    this.remove('authzData', config);
    this.remove('reusable_refresh_token', config);
    this.remove('authnResult', config);
  }

  getAccessToken(config: OpenIdConfiguration): string {
    return this.read('authzData', config);
  }

  getIdToken(config: OpenIdConfiguration): string {
    return this.read('authnResult', config)?.id_token;
  }

  getRefreshToken(config: OpenIdConfiguration): string {
    let refreshToken = this.read('authnResult', config)?.refresh_token;

    if (!refreshToken && config.allowUnsafeReuseRefreshToken) {
      return this.read('reusable_refresh_token', config);
    }

    return refreshToken;
  }

  getAuthenticationResult(config: OpenIdConfiguration): any {
    return this.read('authnResult', config);
  }
}
