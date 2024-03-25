import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable({ providedIn: 'root' })
export class DefaultSessionStorageService implements AbstractSecurityStorage {
  public read(key: string): string|null {
    return sessionStorage.getItem(key);
  }

  public write(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  public remove(key: string): void {
    sessionStorage.removeItem(key);
  }

  public clear(): void {
    sessionStorage.clear();
  }
}
