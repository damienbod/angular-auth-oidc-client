import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from '.';

@Injectable()
export class BrowserStorageMock implements AbstractSecurityStorage {
    store: { [key: string]: any } = {};

    read(key: string): any {
        return this.store[key];
    }

    write(key: string, value: any): void {
        value = !value ? null : value;
        this.store[key] = value;
    }
}
