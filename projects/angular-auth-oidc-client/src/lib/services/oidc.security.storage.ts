import { Injectable } from '@angular/core';
import { ConfigurationProvider } from './auth-configuration.provider';

/**
 * Implement this class-interface to create a custom storage.
 */
@Injectable()
export abstract class OidcSecurityStorage {
    /**
     * This method must contain the logic to read the storage.
     * @param key
     * @return The value of the given key
     */
    public abstract read(key: string): any;

    /**
     * This method must contain the logic to write the storage.
     * @param key
     * @param value The value for the given key
     */
    public abstract write(key: string, value: any): void;
}

@Injectable()
export class BrowserStorage implements OidcSecurityStorage {
    private hasStorage: boolean;

    constructor(private configProvider: ConfigurationProvider) {
        this.hasStorage = typeof Storage !== 'undefined';
    }

    public read(key: string): any {
        if (this.hasStorage) {
            return JSON.parse(this.configProvider.openIDConfiguration.storage.getItem(key + '_' + this.configProvider.openIDConfiguration.client_id));
        }

        return;
    }

    public write(key: string, value: any): void {
        if (this.hasStorage) {
            value = value === undefined ? null : value;
            this.configProvider.openIDConfiguration.storage.setItem(
                key + '_' + this.configProvider.openIDConfiguration.client_id,
                JSON.stringify(value)
            );
        }
    }
}
