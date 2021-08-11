import { Injectable } from '@angular/core';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable()
export class DefaultSessionStorageService implements AbstractSecurityStorage {
  public read(key: string): any {
    return sessionStorage.getItem(key);
  }

  public write(key: string, value: any): void {
    sessionStorage.setItem(key, value);
  }

  public remove(key: string): void {
    sessionStorage.removeItem(key);
  }

  public clear(): void {
    sessionStorage.clear();
  }
}
