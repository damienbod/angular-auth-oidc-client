import { Injectable } from '@angular/core';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config/config.provider';
import { AbstractSecurityStorage } from './abstract-security-storage';

export type SilentRenewState = 'running' | '';

@Injectable()
export class StoragePersistanceService {
    constructor(
        private readonly oidcSecurityStorage: AbstractSecurityStorage,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    get authResult(): any {
        return this.retrieve(this.storageAuthResult);
    }

    set authResult(value: any) {
        this.store(this.storageAuthResult, value);

        const expiresIn = this.authResult?.expires_in;
        if (expiresIn) {
            const accessTokenExpiryTime = new Date().valueOf() + expiresIn * 1000;
            this.accessTokenExpiresIn = accessTokenExpiryTime;
        }
    }

    get accessToken(): string {
        return this.retrieve(this.storageAccessToken) || '';
    }

    set accessToken(value: string) {
        this.store(this.storageAccessToken, value);
    }

    get idToken(): string {
        return this.retrieve(this.storageIdToken) || '';
    }

    set idToken(value: string) {
        this.store(this.storageIdToken, value);
    }

    get authorizedState(): string | undefined {
        return this.retrieve(this.storageAuthorizedState);
    }

    set authorizedState(value: string | undefined) {
        this.store(this.storageAuthorizedState, value);
    }

    get userData(): any {
        return this.retrieve(this.storageUserData);
    }

    set userData(value: any) {
        this.store(this.storageUserData, value);
    }

    get authNonce(): string {
        return this.retrieve(this.storageAuthNonce) || '';
    }

    set authNonce(value: string) {
        this.store(this.storageAuthNonce, value);
    }

    get codeVerifier(): string {
        return this.retrieve(this.storageCodeVerifier) || '';
    }

    set codeVerifier(value: string) {
        this.store(this.storageCodeVerifier, value);
    }

    get authStateControl(): string {
        return this.retrieve(this.storageAuthStateControl) || '';
    }

    set authStateControl(value: string) {
        this.store(this.storageAuthStateControl, value);
    }

    get sessionState(): any {
        return this.retrieve(this.storageSessionState);
    }

    set sessionState(value: any) {
        this.store(this.storageSessionState, value);
    }

    get silentRenewRunning(): SilentRenewState {
        return this.retrieve(this.storageSilentRenewRunning) || '';
    }

    set silentRenewRunning(value: SilentRenewState) {
        this.store(this.storageSilentRenewRunning, value);
    }
    get accessTokenExpiresIn(): any {
        return this.retrieve(this.storageAccessTokenExpiresIn);
    }

    set accessTokenExpiresIn(value: any) {
        this.store(this.storageAccessTokenExpiresIn, value);
    }

    private storageAuthResult = 'authorizationResult';

    private storageAccessToken = 'authorizationData';

    private storageIdToken = 'authorizationDataIdToken';

    private storageAuthorizedState = 'storageAuthorizedState';

    private storageUserData = 'userData';

    private storageAuthNonce = 'authNonce';

    private storageCodeVerifier = 'codeVerifier';

    private storageAuthStateControl = 'authStateControl';

    private storageSessionState = 'session_state';

    private storageSilentRenewRunning = 'storageSilentRenewRunning';

    private storageAccessTokenExpiresIn = 'access_token_expires_at';

    private retrieve(key: string): any {
        const keyToRead = this.createKeyWithPrefix(key);
        return this.oidcSecurityStorage.read(keyToRead);
    }

    private store(key: string, value: any) {
        const keyToStore = this.createKeyWithPrefix(key);
        this.oidcSecurityStorage.write(keyToStore, value);
    }

    resetStorageFlowData() {
        this.store(this.storageSessionState, '');
        this.store(this.storageSilentRenewRunning, '');
        this.store(this.storageCodeVerifier, '');
        this.store(this.storageUserData, '');
    }

    resetAuthStateInStorage() {
        this.store(this.storageAuthorizedState, AuthorizedState.Unknown);
        this.store(this.storageAccessToken, '');
        this.store(this.storageIdToken, '');
        this.store(this.storageAuthResult, '');
    }

    getAccessToken(): any {
        return this.retrieve(this.storageAccessToken);
    }

    getIdToken(): any {
        return this.retrieve(this.storageIdToken);
    }

    getRefreshToken(): any {
        return this.authResult?.refresh_token;
    }
    private createKeyWithPrefix(key: string) {
        const prefix = this.configurationProvider.openIDConfiguration.clientId;

        return `${prefix}_${key}`;
    }
}
