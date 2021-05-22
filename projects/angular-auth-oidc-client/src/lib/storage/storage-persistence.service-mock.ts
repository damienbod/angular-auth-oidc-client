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
  | 'storageCustomParamsRefresh'
  | 'storageCustomParamsEndSession'
  | 'redirect'
  | 'configIds'
  | 'jwtKeys';

export class StoragePersistenceServiceMock {
  read(key: StorageKeys, configId: string): any {}

  write(key: StorageKeys, value: any, configId: string): void {}

  remove(key: StorageKeys, configId: string): void {}

  clear(): void {}

  resetStorageFlowData(configId: string): void {
    this.remove('session_state', configId);
    this.remove('storageSilentRenewRunning', configId);
    this.remove('codeVerifier', configId);
    this.remove('userData', configId);
    this.remove('storageCustomRequestParams', configId);
    this.remove('access_token_expires_at', configId);
    this.remove('storageCustomParamsRefresh', configId);
    this.remove('storageCustomParamsEndSession', configId);
  }

  resetAuthStateInStorage(configId: string): void {}

  getAccessToken(configId: string): string {
    return '';
  }

  getIdToken(configId: string): string {
    return '';
  }

  getRefreshToken(configId: string): string {
    return '';
  }
}
