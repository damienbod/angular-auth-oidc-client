import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LogLevel } from './log-level';

@Injectable()
export class LoggerService {
  logError(configuration: OpenIdConfiguration, message: any, ...args: any[]): void {
    if (this.loggingIsTurnedOff(configuration)) {
      return;
    }

    const { configId } = configuration;

    if (!!args && !!args.length) {
      console.error(`[ERROR] ${configId} - ${message}`, ...args);
    } else {
      console.error(`[ERROR] ${configId} - ${message}`);
    }
  }

  logWarning(configuration: OpenIdConfiguration, message: any, ...args: any[]): void {
    if (!this.logLevelIsSet(configuration)) {
      return;
    }

    if (this.loggingIsTurnedOff(configuration)) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(configuration, LogLevel.Warn)) {
      return;
    }

    const { configId } = configuration;

    if (!!args && !!args.length) {
      console.warn(`[WARN] ${configId} - ${message}`, ...args);
    } else {
      console.warn(`[WARN] ${configId} - ${message}`);
    }
  }

  logDebug(configuration: OpenIdConfiguration, message: any, ...args: any[]): void {
    if (!this.logLevelIsSet(configuration)) {
      return;
    }

    if (this.loggingIsTurnedOff(configuration)) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(configuration, LogLevel.Debug)) {
      return;
    }

    const { configId } = configuration;

    if (!!args && !!args.length) {
      console.log(`[DEBUG] ${configId} - ${message}`, ...args);
    } else {
      console.log(`[DEBUG] ${configId} - ${message}`);
    }
  }

  private currentLogLevelIsEqualOrSmallerThan(configuration: OpenIdConfiguration, logLevelToCompare: LogLevel): boolean {
    const { logLevel } = configuration || {};

    return logLevel <= logLevelToCompare;
  }

  private logLevelIsSet(configuration: OpenIdConfiguration): boolean {
    const { logLevel } = configuration || {};

    if (logLevel === null) {
      return false;
    }

    if (logLevel === undefined) {
      return false;
    }

    return true;
  }

  private loggingIsTurnedOff(configuration: OpenIdConfiguration): boolean {
    const { logLevel } = configuration || {};

    return logLevel === LogLevel.None;
  }
}
