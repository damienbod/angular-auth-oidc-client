import { Injectable } from '@angular/core';
import { AuthConfiguration } from '../modules/auth.configuration';

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

    constructor(private authConfiguration: AuthConfiguration) {
        this.hasStorage = typeof Storage !== 'undefined';
    }

    public read(key: string): any {
        if (this.hasStorage) {
            return JSON.parse(this.authConfiguration.storage.getItem(key));
        }

        return;
    }

    public write(key: string, value: any): void {
        if (this.hasStorage) {
            this.authConfiguration.storage.setItem(key, JSON.stringify(value));
        }
    }

}
