import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { AbstractSecurityStorage } from './abstract-security-storage';

export type StorageKeys =
    | 'authorizationResult'
    | 'authWellKnownEndPoints'
    | 'authorizationData'
    | 'authorizationDataIdToken'
    | 'userData'
    | 'authNonce'
    | 'codeVerifier'
    | 'authStateControl'
    | 'session_state'
    | 'storageSilentRenewRunning'
    | 'access_token_expires_at';

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

    resetStorageFlowData() {
        this.write('session_state', null);
        this.write('storageSilentRenewRunning', null);
        this.write('codeVerifier', null);
        this.write('userData', null);
    }

    resetAuthStateInStorage() {
        this.write('authorizationData', '');
        this.write('authorizationDataIdToken', '');
    }

    getAccessToken(): any {
        return this.read('authorizationData');
    }

    getIdToken(): any {
        return this.read('authorizationDataIdToken');
    }

    getRefreshToken(): any {
        return this.read('authorizationData')?.refresh_token;
    }

    private createKeyWithPrefix(key: string) {
        const prefix = this.configurationProvider.openIDConfiguration.clientId;
        return `${prefix}_${key}`;
    }
}
