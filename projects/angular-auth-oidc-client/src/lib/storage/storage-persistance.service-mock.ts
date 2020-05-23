import { Injectable } from '@angular/core';

export type StorageKeys =
    | 'authnResult'
    | 'authWellKnownEndPoints'
    | 'authzData'
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
    }

    getAccessToken(): any {
        return null;
    }

    getIdToken(): any {
        return null;
    }

    getRefreshToken(): any {
        return null;
    }
}
