import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable()
export class BrowserStorageService implements AbstractSecurityStorage {
  constructor(private configProvider: ConfigurationProvider, private loggerService: LoggerService) {}

  read(key: string): any {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(`Wanted to read '${key}' but Storage was undefined`);
      return false;
    }

    const item = this.getStorage()?.getItem(key);

    if (!item) {
      return null;
    }

    return JSON.parse(item);
  }

  write(key: string, value: any): boolean {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(`Wanted to write '${key}/${value}' but Storage was falsy`);
      return false;
    }

    const storage = this.getStorage();
    if (!storage) {
      this.loggerService.logDebug(`Wanted to write '${key}/${value}' but Storage was falsy`);
      return false;
    }

    value = value || null;

    storage.setItem(`${key}`, JSON.stringify(value));
    return true;
  }

  remove(key: string): boolean {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(`Wanted to remove '${key}' but Storage was falsy`);
      return false;
    }

    const storage = this.getStorage();
    if (!storage) {
      this.loggerService.logDebug(`Wanted to write '${key}' but Storage was falsy`);
      return false;
    }

    storage.removeItem(`${key}`);
    return true;
  }

  clear(): boolean {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(`Wanted to clear storage but Storage was falsy`);
      return false;
    }

    const storage = this.getStorage();
    if (!storage) {
      this.loggerService.logDebug(`Wanted to clear storage but Storage was falsy`);
      return false;
    }

    storage.clear();
    return true;
  }

  private getStorage() {
    const config = this.configProvider.getOpenIDConfiguration();
    if (!config) {
      return null;
    }

    return config.storage;
  }

  private hasStorage() {
    return typeof Storage !== 'undefined';
  }
}
