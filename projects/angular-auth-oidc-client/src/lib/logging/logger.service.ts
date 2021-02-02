import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { LogLevel } from './log-level';

@Injectable()
export class LoggerService {
  constructor(private configurationProvider: ConfigurationProvider) {}

  logError(message: any, ...args: any[]) {
    if (this.loggingIsTurnedOff()) {
      return;
    }

    if (!!args && args.length) {
      console.error(message, args);
    } else {
      console.error(message);
    }
  }

  logWarning(message: any, ...args: string[]) {
    if (!this.logLevelIsSet()) {
      return;
    }

    if (this.loggingIsTurnedOff()) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(LogLevel.warn)) {
      return;
    }

    if (!!args && args.length) {
      console.warn(message, args);
    } else {
      console.warn(message);
    }
  }

  logDebug(message: any, ...args: string[]) {
    if (!this.logLevelIsSet()) {
      return;
    }

    if (this.loggingIsTurnedOff()) {
      return;
    }

    if (!this.currentLogLevelIsEqualOrSmallerThan(LogLevel.debug)) {
      return;
    }

    if (!!args && args.length) {
      console.log(message, args);
    } else {
      console.log(message);
    }
  }

  private currentLogLevelIsEqualOrSmallerThan(logLevel: LogLevel) {
    if (this.logLevelIsSet()) {
      return this.configurationProvider.openIDConfiguration.logLevel <= logLevel;
    }

    return true;
  }

  private logLevelIsSet() {
    return !!this.configurationProvider.openIDConfiguration?.logLevel;
  }

  private loggingIsTurnedOff() {
    return this.configurationProvider.openIDConfiguration?.logLevel === LogLevel.none;
  }
}
