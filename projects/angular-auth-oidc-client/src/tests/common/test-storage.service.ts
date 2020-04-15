import { Injectable } from '@angular/core';
import { OidcSecurityStorage } from '../../lib/storage/oidc.security.storage';

@Injectable()
export class TestStorage implements OidcSecurityStorage {
    store: { [key: string]: any } = {};

    read(key: string): any {
        return this.store[key];
    }

    write(key: string, value: any): void {
        value = !value ? null : value;
        this.store[key] = value;
    }
}
