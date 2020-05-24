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
    read(key: StorageKeys): any {}

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
        return this.read('authzData');
    }

    getIdToken(): any {
        return this.read('authnResult')?.id_token;
    }

    getRefreshToken(): any {
        return this.read('authnResult')?.refresh_token;
    }
}
