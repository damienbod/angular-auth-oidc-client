import { inject, Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { AbstractSecurityStorage } from './abstract-security-storage';

@Injectable({ providedIn: 'root' })
export class BrowserStorageService {
  private readonly loggerService = inject(LoggerService);
  private readonly abstractSecurityStorage = inject(AbstractSecurityStorage);

  read(key: string, configuration: OpenIdConfiguration): any {
    const { configId } = configuration;

    if (!configId) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to read '${key}' but configId was '${configId}'`
      );

      return null;
    }

    if (!this.hasStorage()) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to read '${key}' but Storage was undefined`
      );

      return null;
    }

    const storedConfig = this.abstractSecurityStorage.read(configId);

    if (!storedConfig) {
      return null;
    }

    return JSON.parse(storedConfig);
  }

  write(value: any, configuration: OpenIdConfiguration): boolean {
    const { configId } = configuration;

    if (!configId) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to write but configId was '${configId}'`
      );

      return false;
    }

    if (!this.hasStorage()) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to write but Storage was falsy`
      );

      return false;
    }

    value = value || null;

    this.abstractSecurityStorage.write(configId, JSON.stringify(value));

    return true;
  }

  remove(key: string, configuration: OpenIdConfiguration): boolean {
    const { configId } = configuration;

    if (!configId) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to remove '${key}' but configId was '${configId}'`
      );

      return false;
    }

    if (!this.hasStorage()) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to remove '${key}' but Storage was falsy`
      );

      return false;
    }

    this.abstractSecurityStorage.remove(configId);

    return true;
  }

  clear(configuration: OpenIdConfiguration): boolean {
    const { configId } = configuration;

    if (!configId) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to clear storage but configId was '${configId}'`
      );

      return false;
    }

    if (!this.hasStorage()) {
      this.loggerService.logDebug(
        configuration,
        `Wanted to clear storage but Storage was falsy`
      );

      return false;
    }

    this.abstractSecurityStorage.remove(configId);

    return true;
  }

  private hasStorage(): boolean {
    return typeof Storage !== 'undefined';
  }
}
