import { Injectable } from '@angular/core';
import { AuthConfiguration } from '../modules/auth.configuration';
import { OidcSecurityStorage } from './oidc.security.storage';

@Injectable()
export class OidcSecurityCommon {

    storage_access_token = 'authorizationData';
    storage_id_token = 'authorizationDataIdToken';
    storage_is_authorized = '_isAuthorized';
    storage_user_data = 'userData';
    storage_auth_nonce = 'authNonce';
    storage_auth_state_control = 'authStateControl';
    storage_well_known_endpoints = 'wellknownendpoints';
    storage_session_state = 'session_state';
    storage_silent_renew_running = 'storage_silent_renew_running';

    constructor(private authConfiguration: AuthConfiguration, private oidcSecurityStorage: OidcSecurityStorage) {
    }

    setupModule() { }

    retrieve(key: string): any {
        return this.oidcSecurityStorage.read(key);
    }

    store(key: string, value: any) {
        this.oidcSecurityStorage.write(key, value);
    }

    resetStorageData(isRenewProcess: boolean) {
        if (!isRenewProcess) {
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