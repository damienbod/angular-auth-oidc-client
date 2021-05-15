import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { LogLevel } from './log-level';

@Injectable()
export class LoggerService {
  constructor(private configurationProvider: ConfigurationProvider) {}

  logError(configId: string, message: any, ...args: any[]) {
    if (this.loggingIsTurnedOff(configId)) {
      return;
    }

    if (!!args && args.length) {
      console.error(`[ERROR] ${configId} - ${message}`, ...args);
    } else {
      console.error(`[ERROR] ${configId} - ${message}`);
    }
  }

  logWarning(configId: string, message: any, ...args: any[]) {
    if (!this.logLevelIsSet(configId)) {
      return;
    }

    if (this.loggingIsTurnedOff(configId)) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(configId, LogLevel.Warn)) {
      return;
    }

    if (!!args && args.length) {
      console.warn(`[WARN] ${configId} - ${message}`, ...args);
    } else {
      console.warn(`[WARN] ${configId} - ${message}`);
    }
  }

  logDebug(configId: string, message: any, ...args: any[]) {
    if (!this.logLevelIsSet(configId)) {
      return;
    }

    if (this.loggingIsTurnedOff(configId)) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(configId, LogLevel.Debug)) {
      return;
    }

    if (!!args && args.length) {
      console.log(`[DEBUG] ${configId} - ${message}`, ...args);
    } else {
      console.log(`[DEBUG] ${configId} - ${message}`);
    }
  }

  private currentLogLevelIsEqualOrSmallerThan(configId: string, logLevelToCompare: LogLevel) {
    const { logLevel } = this.configurationProvider.getOpenIDConfiguration(configId) || {};
    return logLevel <= logLevelToCompare;
  }

  private logLevelIsSet(configId: string) {
    const { logLevel } = this.configurationProvider.getOpenIDConfiguration(configId) || {};

    if (logLevel === null) {
      return false;
    }

    if (logLevel === undefined) {
      return false;
    }

    return true;
  }

  private loggingIsTurnedOff(configId: string) {
    const { logLevel } = this.configurationProvider.getOpenIDConfiguration(configId) || {};

    return logLevel === LogLevel.None;
  }
}
