import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config';
import { OidcSecurityStorage } from './oidc.security.storage';

export type SilentRenewState = 'running' | '';

@Injectable()
export class OidcSecurityCommon {
    constructor(private oidcSecurityStorage: OidcSecurityStorage, private readonly configurationProvider: ConfigurationProvider) {}

    private storageAuthResult = 'authorizationResult';

    public get authResult(): any {
        return this.retrieve(this.storageAuthResult);
    }

    public set authResult(value: any) {
        this.store(this.storageAuthResult, value);
    }

    private storageAccessToken = 'authorizationData';

    public get accessToken(): string {
        return this.retrieve(this.storageAccessToken) || '';
    }

    public set accessToken(value: string) {
        this.store(this.storageAccessToken, value);
    }

    private storageIdToken = 'authorizationDataIdToken';

    public get idToken(): string {
        return this.retrieve(this.storageIdToken) || '';
    }

    public set idToken(value: string) {
        this.store(this.storageIdToken, value);
    }

    private storageIsAuthorized = 'storageIsAuthorized';

    public get isAuthorized(): boolean | undefined {
        return this.retrieve(this.storageIsAuthorized);
    }

    public set isAuthorized(value: boolean | undefined) {
        this.store(this.storageIsAuthorized, value);
    }

    private storageUserData = 'userData';

    public get userData(): any {
        return this.retrieve(this.storageUserData);
    }

    public set userData(value: any) {
        this.store(this.storageUserData, value);
    }

    private storageAuthNonce = 'authNonce';

    public get authNonce(): string {
        return this.retrieve(this.storageAuthNonce) || '';
    }

    public set authNonce(value: string) {
        this.store(this.storageAuthNonce, value);
    }

    private storageCodeVerifier = 'codeVerifier';

    public get codeVerifier(): string {
        return this.retrieve(this.storageCodeVerifier) || '';
    }

    public set codeVerifier(value: string) {
        this.store(this.storageCodeVerifier, value);
    }

    private storageAuthStateControl = 'authStateControl';

    public get authStateControl(): string {
        return this.retrieve(this.storageAuthStateControl) || '';
    }

    public set authStateControl(value: string) {
        this.store(this.storageAuthStateControl, value);
    }

    private storageSessionState = 'session_state';

    public get sessionState(): any {
        return this.retrieve(this.storageSessionState);
    }

    public set sessionState(value: any) {
        this.store(this.storageSessionState, value);
    }

    private storageSilentRenewRunning = 'storageSilentRenewRunning';

    public get silentRenewRunning(): SilentRenewState {
        return this.retrieve(this.storageSilentRenewRunning) || '';
    }

    public set silentRenewRunning(value: SilentRenewState) {
        this.store(this.storageSilentRenewRunning, value);
    }

    private retrieve(key: string): any {
        const prefix = this.configurationProvider.openIDConfiguration.clientId;
        return this.oidcSecurityStorage.read(prefix + key);
    }

    private store(key: string, value: any) {
        const prefix = this.configurationProvider.openIDConfiguration.clientId;
        this.oidcSecurityStorage.write(prefix + key, value);
    }

    resetStorageData(isRenewProcess: boolean) {
        if (!isRenewProcess) {
            this.store(this.storageAuthResult, '');
            this.store(this.storageSessionState, '');
            this.store(this.storageSilentRenewRunning, '');
            this.store(this.storageIsAuthorized, false);
            this.store(this.storageAccessToken, '');
            this.store(this.storageIdToken, '');
            this.store(this.storageUserData, '');
            this.store(this.storageCodeVerifier, '');
        }
    }

    getAccessToken(): any {
        return this.retrieve(this.storageAccessToken);
    }

    getIdToken(): any {
        return this.retrieve(this.storageIdToken);
    }

    getRefreshToken(): any {
        return this.authResult.refresh_token;
    }
}
