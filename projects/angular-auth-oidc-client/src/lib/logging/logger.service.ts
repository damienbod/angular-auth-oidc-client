import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { AbstractLoggerService } from './abstract-logger.service';
import { LogLevel } from './log-level';

@Injectable()
export class LoggerService {
  constructor(private abstractLoggerService: AbstractLoggerService) {}

  logError(configuration: OpenIdConfiguration, message: any, ...args: any[]): void {
    if (this.loggingIsTurnedOff(configuration)) {
      return;
    }

    const { configId } = configuration;

    if (!!args && !!args.length) {
      this.abstractLoggerService.logError(`[ERROR] ${configId} - ${message}`, ...args);
    } else {
      this.abstractLoggerService.logError(`[ERROR] ${configId} - ${message}`);
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
      this.abstractLoggerService.logWarning(`[WARN] ${configId} - ${message}`, ...args);
    } else {
      this.abstractLoggerService.logWarning(`[WARN] ${configId} - ${message}`);
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
      this.abstractLoggerService.logDebug(`[DEBUG] ${configId} - ${message}`, ...args);
    } else {
      this.abstractLoggerService.logDebug(`[DEBUG] ${configId} - ${message}`);
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
