import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { LogLevel } from './log-level';

@Injectable()
export class LoggerService {
    constructor(private configurationProvider: ConfigurationProvider) {}

    logError(message: any, ...args: any[]) {
        console.error(message, ...args);
    }

    logWarning(message: any) {
        if (this.currentLogLevelIsEqualOrSmallerThan(LogLevel.Warn)) {
            console.warn(message);
        }
    }

    logDebug(message: any, ...args: string[]) {
        if (this.currentLogLevelIsEqualOrSmallerThan(LogLevel.Debug)) {
            console.log(message, args);
        }
    }

    private currentLogLevelIsEqualOrSmallerThan(logLevel: LogLevel) {
        return this.configurationProvider.openIDConfiguration.logLevel <= logLevel;
    }
}
