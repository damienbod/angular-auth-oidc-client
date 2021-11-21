import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable()
export class BrowserStorageService {
  constructor(private loggerService: LoggerService) {}

  read(key: string, configuration: OpenIdConfiguration): any {
    const { configId } = configuration;

    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to read '${key}' but Storage was undefined`);

      return null;
    }

    const storage = this.getStorage(configuration);

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

  write(value: any, configuration: OpenIdConfiguration): boolean {
    const { configId } = configuration;

    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to write '${value}' but Storage was falsy`);

      return false;
    }

    const storage = this.getStorage(configuration);
    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to write '${value}' but Storage was falsy`);

      return false;
    }

    value = value || null;

    storage.write(configId, JSON.stringify(value));

    return true;
  }

  remove(key: string, configuration: OpenIdConfiguration): boolean {
    const { configId } = configuration;

    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to remove '${key}' but Storage was falsy`);

      return false;
    }

    const storage = this.getStorage(configuration);
    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to write '${key}' but Storage was falsy`);

      return false;
    }

    storage.remove(key);

    return true;
  }

  // TODO THIS STORAGE WANTS AN ID BUT CLEARS EVERYTHING
  clear(configuration: OpenIdConfiguration): boolean {
    const { configId } = configuration;

    if (!this.hasStorage()) {
      this.loggerService.logDebug(configId, `Wanted to clear storage but Storage was falsy`);

      return false;
    }

    const storage = this.getStorage(configuration);
    if (!storage) {
      this.loggerService.logDebug(configId, `Wanted to clear storage but Storage was falsy`);

      return false;
    }

    storage.clear();

    return true;
  }

  private getStorage(configuration: OpenIdConfiguration): AbstractSecurityStorage {
    const { storage } = configuration || {};

    return storage;
  }

  private hasStorage(): boolean {
    return typeof Storage !== 'undefined';
  }
}
