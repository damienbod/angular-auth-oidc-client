import { Injectable } from '@angular/core';

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
export class LocalStorage implements OidcSecurityStorage {

    public storage: any;

    private hasStorage: boolean;

    constructor() {
        this.hasStorage = typeof Storage !== 'undefined';

        // Default is sessionStorage.
        if (this.hasStorage) { this.storage = sessionStorage; }
    }

    public read(key: string): any {
        if (this.hasStorage) {
            return JSON.parse(this.storage.getItem(key));
        }

        return;
    }

    public write(key: string, value: string): void {
        if (this.hasStorage) {
            this.storage.setItem(key, JSON.stringify(value));
        }
    }

}
