import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoggerService } from '../logging/logger.service';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable()
export class BrowserStorageService implements AbstractSecurityStorage {
  constructor(private configProvider: ConfigurationProvider, private loggerService: LoggerService) {}

  read(key: string, configId: string): any {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to read '${key}' but Storage was undefined`);
      return false;
    }

    const item = this.getStorage(configId)?.getItem(key);

    if (!item) {
      return null;
    }

    return JSON.parse(item);
  }

  write(key: string, value: any, configId: string): boolean {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to write '${key}/${value}' but Storage was falsy`);
      return false;
    }

    const storage = this.getStorage(configId);
    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to write '${key}/${value}' but Storage was falsy`);
      return false;
    }

    value = value || null;

    storage.setItem(`${key}`, JSON.stringify(value));
    return true;
  }

  remove(key: string, configId: string): boolean {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to remove '${key}' but Storage was falsy`);
      return false;
    }

    const storage = this.getStorage(configId);
    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to write '${key}' but Storage was falsy`);
      return false;
    }

    storage.removeItem(`${key}`);
    return true;
  }

  // TODO THIS STORAGE WANTS AN ID BUT CLEARS EVERYTHING
  clear(configId: string): boolean {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to clear storage but Storage was falsy`);
      return false;
    }

    const storage = this.getStorage(configId);
    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to clear storage but Storage was falsy`);
      return false;
    }

    storage.clear();
    return true;
  }

  private getStorage(configId: string) {
    const { storage } = this.configProvider.getOpenIDConfiguration(configId) || {};

    return storage;
  }

  private hasStorage() {
    return typeof Storage !== 'undefined';
  }
}
