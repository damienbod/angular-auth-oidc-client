import { Injectable } from '@angular/core';
import { OidcSecurityStorage } from './oidc.security.storage';

export type SilentRenewState = 'running' | '';

@Injectable()
export class OidcSecurityCommon {
    private storage_auth_result = 'authorizationResult';

    public get authResult(): any {
        return this.retrieve(this.storage_auth_result);
    }

    public set authResult(value: any) {
        this.store(this.storage_auth_result, value);
    }

    private storage_access_token = 'authorizationData';

    public get accessToken(): string {
        return this.retrieve(this.storage_access_token) || '';
    }

    public set accessToken(value: string) {
        this.store(this.storage_access_token, value);
    }

    private storage_id_token = 'authorizationDataIdToken';

    public get idToken(): string {
        return this.retrieve(this.storage_id_token) || '';
    }

    public set idToken(value: string) {
        this.store(this.storage_id_token, value);
    }

    private storage_is_authorized = '_isAuthorized';

    public get isAuthorized(): boolean | undefined {
        return this.retrieve(this.storage_is_authorized);
    }

    public set isAuthorized(value: boolean | undefined) {
        this.store(this.storage_is_authorized, value);
    }

    private storage_user_data = 'userData';

    public get userData(): any {
        return this.retrieve(this.storage_user_data);
    }

    public set userData(value: any) {
        this.store(this.storage_user_data, value);
    }

    private storage_auth_nonce = 'authNonce';

    public isAuthNonceValid(nonce: string): boolean {
        const nonces = this.getValuesFromSerializedCacheDictionary(this.storage_auth_nonce,
            (_createDate, _value) => _value === nonce,
            (_createDate) => (_createDate + (3600000)) < Date.now()); //1 hour expiration

        const isValid = nonces.find((n) => n === nonce) !== undefined;

        if(isValid) this.removeValueFromSerializedCacheDictionary(this.storage_auth_nonce, nonce);

        return isValid;
    }

    public addAuthNonce(value: string) {
        this.addValueToSerializedCacheDictionary(this.storage_auth_nonce, value);
    }

    private storage_auth_state_control = 'authStateControl';

    public getAuthStates(): string[] {
        return this.getValuesFromSerializedCacheDictionary(this.storage_auth_state_control,
            () => true,
            (createDate) => (createDate + (3600000)) < Date.now()); //1 hour expiration
    }

    public addAuthState(value: string) {
        this.addValueToSerializedCacheDictionary(this.storage_auth_state_control, value);
    }

    public removeAuthState(state: string) {
        this.removeValueFromSerializedCacheDictionary(this.storage_auth_state_control, state);
    }

    private storage_session_state = 'session_state';

    public get sessionState(): any {
        return this.retrieve(this.storage_session_state);
    }

    public set sessionState(value: any) {
        this.store(this.storage_session_state, value);
    }

    private storage_silent_renew_running = 'storage_silent_renew_running';

    public get silentRenewRunning(): SilentRenewState {
        return this.retrieve(this.storage_silent_renew_running) || '';
    }

    public set silentRenewRunning(value: SilentRenewState) {
        this.store(this.storage_silent_renew_running, value);
    }

    private storage_custom_request_params = 'storage_custom_request_params';

    public get customRequestParams(): {
        [key: string]: string | number | boolean;
    } {
        return this.retrieve(this.storage_custom_request_params);
    }

    public set customRequestParams(value: {
        [key: string]: string | number | boolean;
    }) {
        this.store(this.storage_custom_request_params, value);
    }

    constructor(private oidcSecurityStorage: OidcSecurityStorage) {}

    private addValueToSerializedCacheDictionary(storageKey: string, value: string) {
        const serializedValue = this.retrieve(storageKey) || '{}';

        let currentValue = JSON.parse(serializedValue);

        currentValue[Date.now()] = value;

        this.store(storageKey, JSON.stringify(currentValue));
    }

    private removeValueFromSerializedCacheDictionary(storageKey: string, value: string) {
        this.getValuesFromSerializedCacheDictionary(storageKey,
            () => false,
            (_createDate, _value) => _value === value);
    }

    private getValuesFromSerializedCacheDictionary(storageKey: string,
        getPredicate: (createDate: number, value: string) => boolean,
        removePredicate: (createDate: number, value: string) => boolean): string[] {
        const serializedValue = this.retrieve(storageKey) || '{}';
        const currentValue = JSON.parse(serializedValue);
        const keysToDelete: string[] = [];
        const values: string[] = [];

        for (let key in currentValue) {
            if (currentValue.hasOwnProperty(key)) {
                const dateAdded = Number(key);
                if (dateAdded === NaN) continue;

                if (removePredicate(dateAdded, currentValue[key])) {
                    keysToDelete.push(dateAdded.toString());
                } else if(getPredicate(dateAdded, currentValue[key])){
                    values.push(currentValue[key]);
                }
            }
        }

        for (let key in keysToDelete.values()) {
            delete currentValue[key];
        }

        this.store(storageKey, JSON.stringify(currentValue));

        return values;
    }

    private retrieve(key: string): any {
        return this.oidcSecurityStorage.read(key);
    }

    private store(key: string, value: any) {
        this.oidcSecurityStorage.write(key, value);
    }

    resetStorageData(isRenewProcess: boolean) {
        if (!isRenewProcess) {
            this.store(this.storage_auth_result, '');
            this.store(this.storage_session_state, '');
            this.store(this.storage_silent_renew_running, '');
            this.store(this.storage_is_authorized, false);
            this.store(this.storage_access_token, '');
            this.store(this.storage_id_token, '');
            this.store(this.storage_user_data, '');
        }
    }

    getAccessToken(): any {
        return this.retrieve(this.storage_access_token);
    }

    getIdToken(): any {
        return this.retrieve(this.storage_id_token);
    }
}
