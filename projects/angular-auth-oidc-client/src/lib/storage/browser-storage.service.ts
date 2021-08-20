import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoggerService } from '../logging/logger.service';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable()
export class BrowserStorageService {
  constructor(private configProvider: ConfigurationProvider, private loggerService: LoggerService) {}

  read(key: string, configId: string): any {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to read '${key}' but Storage was undefined`);

      return null;
    }

    const storage = this.getStorage(configId);

    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to read config for '${configId}' but Storage was falsy`);

      return null;
    }

    const storedConfig = storage.read(configId);

    if (!storedConfig) {
      return null;
    }

    return JSON.parse(storedConfig);
  }

  write(value: any, configId: string): boolean {
    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to write '${value}' but Storage was falsy`);

      return false;
    }

    const storage = this.getStorage(configId);
    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to write '${value}' but Storage was falsy`);

      return false;
    }

    value = value || null;

    storage.write(configId, JSON.stringify(value));

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

    storage.remove(key);

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

  private getStorage(configId: string): AbstractSecurityStorage {
    const { storage } = this.configProvider.getOpenIDConfiguration(configId) || {};

    return storage;
  }

  private hasStorage(): boolean {
    return typeof Storage !== 'undefined';
  }
}
