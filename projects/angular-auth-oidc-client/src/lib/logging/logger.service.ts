import { Injectable } from '@angular/core';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { AbstractLoggerService } from './abstract-logger.service';
import { LogLevel } from './log-level';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  constructor(private readonly abstractLoggerService: AbstractLoggerService) {}

  logError(
    configuration: OpenIdConfiguration,
    message: any,
    ...args: any[]
  ): void {
    if (this.loggingIsTurnedOff(configuration)) {
      return;
    }

    const { configId } = configuration;
    const messageToLog = this.isObject(message)
      ? JSON.stringify(message)
      : message;

    if (!!args && !!args.length) {
      this.abstractLoggerService.logError(
        `[ERROR] ${configId} - ${messageToLog}`,
        ...args
      );
    } else {
      this.abstractLoggerService.logError(
        `[ERROR] ${configId} - ${messageToLog}`
      );
    }
  }

  logWarning(
    configuration: OpenIdConfiguration,
    message: any,
    ...args: any[]
  ): void {
    if (!this.logLevelIsSet(configuration)) {
      return;
    }

    if (this.loggingIsTurnedOff(configuration)) {
      return;
    }

    if (
      !this.currentLogLevelIsEqualOrSmallerThan(configuration, LogLevel.Warn)
    ) {
      return;
    }

    const { configId } = configuration;
    const messageToLog = this.isObject(message)
      ? JSON.stringify(message)
      : message;

    if (!!args && !!args.length) {
      this.abstractLoggerService.logWarning(
        `[WARN] ${configId} - ${messageToLog}`,
        ...args
      );
    } else {
      this.abstractLoggerService.logWarning(
        `[WARN] ${configId} - ${messageToLog}`
      );
    }
  }

  logDebug(
    configuration: OpenIdConfiguration,
    message: any,
    ...args: any[]
  ): void {
    if (!this.logLevelIsSet(configuration)) {
      return;
    }

    if (this.loggingIsTurnedOff(configuration)) {
      return;
    }

    if (
      !this.currentLogLevelIsEqualOrSmallerThan(configuration, LogLevel.Debug)
    ) {
      return;
    }

    const { configId } = configuration;
    const messageToLog = this.isObject(message)
      ? JSON.stringify(message)
      : message;

    if (!!args && !!args.length) {
      this.abstractLoggerService.logDebug(
        `[DEBUG] ${configId} - ${messageToLog}`,
        ...args
      );
    } else {
      this.abstractLoggerService.logDebug(
        `[DEBUG] ${configId} - ${messageToLog}`
      );
    }
  }

  private currentLogLevelIsEqualOrSmallerThan(
    configuration: OpenIdConfiguration,
    logLevelToCompare: LogLevel
  ): boolean {
    const { logLevel } = configuration || {};

    return logLevel <= logLevelToCompare;
  }

  private logLevelIsSet(configuration: OpenIdConfiguration): boolean {
    const { logLevel } = configuration || {};

    if (logLevel === null) {
      return false;
    }

    return logLevel !== undefined;
  }

  private loggingIsTurnedOff(configuration: OpenIdConfiguration): boolean {
    const { logLevel } = configuration || {};

    return logLevel === LogLevel.None;
  }

  private isObject(possibleObject: any): boolean {
    return Object.prototype.toString.call(possibleObject) === '[object Object]';
  }
}
