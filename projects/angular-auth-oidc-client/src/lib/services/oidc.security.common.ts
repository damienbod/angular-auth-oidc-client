import { Injectable } from '@angular/core';
import { OidcSecurityStorage } from './oidc.security.storage';

export type SilentRenewState = 'running' | '';

@Injectable()
export class OidcSecurityCommon {
    private storageAuthResultInternal = 'authorizationResult';

    public get authResult(): any {
        return this.retrieve(this.storageAuthResultInternal);
    }

    public set authResult(value: any) {
        this.store(this.storageAuthResultInternal, value);
    }

    private storageAccessTokenInternal = 'authorizationData';

    public get accessToken(): string {
        return this.retrieve(this.storageAccessTokenInternal) || '';
    }

    public set accessToken(value: string) {
        this.store(this.storageAccessTokenInternal, value);
    }

    private storageIdTokenInternal = 'authorizationDataIdToken';

    public get idToken(): string {
        return this.retrieve(this.storageIdTokenInternal) || '';
    }

    public set idToken(value: string) {
        this.store(this.storageIdTokenInternal, value);
    }

    private storageIsAuthorizedInternal = '_isAuthorized';

    public get isAuthorized(): boolean | undefined {
        return this.retrieve(this.storageIsAuthorizedInternal);
    }

    public set isAuthorized(value: boolean | undefined) {
        this.store(this.storageIsAuthorizedInternal, value);
    }

    private storageUserDataInternal = 'userData';

    public get userData(): any {
        return this.retrieve(this.storageUserDataInternal);
    }

    public set userData(value: any) {
        this.store(this.storageUserDataInternal, value);
    }

    private storageAuthNonceInternal = 'authNonce';

    public get authNonce(): string {
        return this.retrieve(this.storageAuthNonceInternal) || '';
    }

    public set authNonce(value: string) {
        this.store(this.storageAuthNonceInternal, value);
    }

    private SotrageCodeVerifierInternal = 'code_verifier';

    public get code_verifier(): string {
        return this.retrieve(this.SotrageCodeVerifierInternal) || '';
    }

    public set code_verifier(value: string) {
        this.store(this.SotrageCodeVerifierInternal, value);
    }

    private storageAuthStateControlInternal = 'authStateControl';

    public get authStateControl(): string {
        return this.retrieve(this.storageAuthStateControlInternal) || '';
    }

    public set authStateControl(value: string) {
        this.store(this.storageAuthStateControlInternal, value);
    }

    private storageSessionStateInternal = 'session_state';

    public get sessionState(): any {
        return this.retrieve(this.storageSessionStateInternal);
    }

    public set sessionState(value: any) {
        this.store(this.storageSessionStateInternal, value);
    }

    private storageSilentRenewRunningInternal = 'storage_silent_renew_running';

    public get silentRenewRunning(): SilentRenewState {
        return this.retrieve(this.storageSilentRenewRunningInternal) || '';
    }

    public set silentRenewRunning(value: SilentRenewState) {
        this.store(this.storageSilentRenewRunningInternal, value);
    }

    private storageCustomRequestParamsInternal = 'storage_custom_request_params';

    public get customRequestParams(): {
        [key: string]: string | number | boolean;
    } {
        return this.retrieve(this.storageCustomRequestParamsInternal);
    }

    public set customRequestParams(value: { [key: string]: string | number | boolean }) {
        this.store(this.storageCustomRequestParamsInternal, value);
    }

    constructor(private oidcSecurityStorage: OidcSecurityStorage) {}

    private retrieve(key: string): any {
        return this.oidcSecurityStorage.read(key);
    }

    private store(key: string, value: any) {
        this.oidcSecurityStorage.write(key, value);
    }

    resetStorageData(isRenewProcess: boolean) {
        if (!isRenewProcess) {
            this.store(this.storageAuthResultInternal, '');
            this.store(this.storageSessionStateInternal, '');
            this.store(this.storageSilentRenewRunningInternal, '');
            this.store(this.storageIsAuthorizedInternal, false);
            this.store(this.storageAccessTokenInternal, '');
            this.store(this.storageIdTokenInternal, '');
            this.store(this.storageUserDataInternal, '');
            this.store(this.SotrageCodeVerifierInternal, '');
        }
    }

    getAccessToken(): any {
        return this.retrieve(this.storageAccessTokenInternal);
    }

    getIdToken(): any {
        return this.retrieve(this.storageIdTokenInternal);
    }
}
