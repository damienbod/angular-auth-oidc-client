import { Injectable } from '@angular/core';

export type StorageKeys =
    | 'authnResult'
    | 'authWellKnownEndPoints'
    | 'authzData'
    | 'authorizationDataIdToken'
    | 'userData'
    | 'authNonce'
    | 'codeVerifier'
    | 'authStateControl'
    | 'session_state'
    | 'storageSilentRenewRunning'
    | 'access_token_expires_at';

@Injectable()
export class StoragePersistanceServiceMock {
    read(key: StorageKeys) {}

    write(key: StorageKeys, value: any) {}

    resetStorageFlowData() {
        this.write('session_state', null);
        this.write('storageSilentRenewRunning', null);
        this.write('codeVerifier', null);
        this.write('userData', null);
    }

    resetAuthStateInStorage() {
        this.write('authnResult', '');
        this.write('authorizationDataIdToken', '');
    }

    getAccessToken(): any {
        return this.read('authzData');
    }

    getIdToken(): any {
        return this.read('authorizationDataIdToken');
    }

    getRefreshToken(): any {
        return '';
    }
}
