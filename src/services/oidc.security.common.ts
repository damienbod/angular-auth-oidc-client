import { Injectable } from '@angular/core';
import { AuthConfiguration } from '../auth.configuration';

@Injectable()
export class OidcSecurityCommon {

    private storage: any;

    storage_access_token = 'authorizationData';
    storage_id_token = 'authorizationDataIdToken';
    storage_is_authorized = '_isAuthorized';
    storage_user_data = 'userData';
    storage_auth_nonce = 'authNonce';
    storage_auth_state_control = 'authStateControl';
    storage_well_known_endpoints = 'wellknownendpoints';

    constructor(private authConfiguration: AuthConfiguration) {
        this.storage = sessionStorage; //localStorage;
    }

    retrieve(key: string): any {
        let item = this.storage.getItem(key);

        if (item && item !== 'undefined') {
            return JSON.parse(this.storage.getItem(key));
        }

        return;
    }

    store(key: string, value: any) {
        this.storage.setItem(key, JSON.stringify(value));
    }

    resetStorageData() {
        this.store(this.storage_access_token, '');
        this.store(this.storage_id_token, '');
        this.store(this.storage_is_authorized, false);
        this.store(this.storage_user_data, '');
    }

    getAccessToken(): any {
        return this.retrieve(this.storage_access_token);
    }

    logError(message: any) {
        console.error(message);
    }

    logWarning(message: any) {
        if (this.authConfiguration.log_console_warning_active) {
            console.warn(message);
        }
    }

    logDebug(message: any) {
        if (this.authConfiguration.log_console_debug_active) {
            console.log(message);
        }
    }
}