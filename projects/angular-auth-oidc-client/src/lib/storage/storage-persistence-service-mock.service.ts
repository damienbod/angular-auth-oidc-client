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
export class StoragePersistenceServiceMock {
  read(key: StorageKeys): any {}

  write(key: StorageKeys, value: any) {}

  remove(key: StorageKeys) {}

  clear() {}

  resetStorageFlowData() {
    this.remove('session_state');
    this.remove('storageSilentRenewRunning');
    this.remove('codeVerifier');
    this.remove('userData');
    this.remove('access_token_expires_at');
  }

  resetAuthStateInStorage() {
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
}
