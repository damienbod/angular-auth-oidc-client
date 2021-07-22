import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LogLevel } from './log-level';

@Injectable()
export class LoggerService {
  constructor(private configurationProvider: ConfigurationProvider) {}

  logError(configId: string, message: any, ...args: any[]): void {
    if (!!configId) {
      this.logErrorWithConfig(configId, message, ...args);
    } else {
      this.logErrorWithoutConfig(message, ...args);
    }
  }

  logWarning(configId: string, message: any, ...args: any[]): void {
    if (!!configId) {
      this.logWarningWithConfig(configId, message, ...args);
    } else {
      this.logWarningWithoutConfig(message, ...args);
    }
  }

  logDebug(configId: string, message: any, ...args: any[]): void {
    if (!this.logLevelIsSet(configId)) {
      return;
    }

    if (this.loggingIsTurnedOff(configId)) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(configId, LogLevel.Debug)) {
      return;
    }

    if (!!args && !!args.length) {
      console.log(`[DEBUG] ${configId} - ${message}`, ...args);
    } else {
      console.log(`[DEBUG] ${configId} - ${message}`);
    }
  }

  private logWarningWithoutConfig(message: any, ...args: any[]): void {
    if (!!args && !!args.length) {
      console.warn(`[WARN] - ${message}`, ...args);
    } else {
      console.warn(`[WARN] - ${message}`);
    }
  }

  private logWarningWithConfig(configId: string, message: any, ...args: any[]): void {
    if (!this.logLevelIsSet(configId)) {
      return;
    }

    if (this.loggingIsTurnedOff(configId)) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(configId, LogLevel.Warn)) {
      return;
    }

    if (!!args && !!args.length) {
      console.warn(`[WARN] ${configId} - ${message}`, ...args);
    } else {
      console.warn(`[WARN] ${configId} - ${message}`);
    }
  }

  private logErrorWithConfig(configId: string, message: any, ...args: any[]): void {
    if (this.loggingIsTurnedOff(configId)) {
      return;
    }

    if (!!args && !!args.length) {
      console.error(`[ERROR] ${configId} - ${message}`, ...args);
    } else {
      console.error(`[ERROR] ${configId} - ${message}`);
    }
  }

  private logErrorWithoutConfig(message: any, ...args: any[]): void {
    if (!!args && !!args.length) {
      console.error(`[ERROR] - ${message}`, ...args);
    } else {
      console.error(`[ERROR] - ${message}`);
    }
  }

  private currentLogLevelIsEqualOrSmallerThan(configId: string, logLevelToCompare: LogLevel): boolean {
    const { logLevel } = this.configurationProvider.getOpenIDConfiguration(configId) || {};

    return logLevel <= logLevelToCompare;
  }

  private logLevelIsSet(configId: string): boolean {
    const { logLevel } = this.configurationProvider.getOpenIDConfiguration(configId) || {};

    if (logLevel === null) {
      return false;
    }

    if (logLevel === undefined) {
      return false;
    }

    return true;
  }

  private loggingIsTurnedOff(configId: string): boolean {
    const { logLevel } = this.configurationProvider.getOpenIDConfiguration(configId) || {};

    return logLevel === LogLevel.None;
  }
}
