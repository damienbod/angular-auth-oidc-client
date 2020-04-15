import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable()
export class BrowserStorageService implements AbstractSecurityStorage {
    private hasStorage = typeof Storage !== 'undefined';
    private localOrSessionStorage = this.configProvider.openIDConfiguration.storage;

    constructor(private configProvider: ConfigurationProvider) {}

    public read(key: string): any {
        if (!this.hasStorage) {
            return null;
        }

        const item = this.localOrSessionStorage.getItem(key);

        if (!item) {
            return null;
        }

        return JSON.parse(item);
    }

    public write(key: string, value: any): void {
        if (!this.hasStorage) {
            return null;
        }

        value = value || null;

        this.localOrSessionStorage.setItem(`${key}`, JSON.stringify(value));
    }
}
