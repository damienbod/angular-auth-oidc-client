import { Injectable } from '@angular/core';
import { ConfigurationProvider } from '../config/config.provider';
import { LogLevel } from './log-level';

@Injectable()
export class LoggerService {
    constructor(private configurationProvider: ConfigurationProvider) {}

    logError(message: any, ...args: any[]) {
        if (args.length) {
            console.error(message, args);
        }
        console.error(message);
    }

    logWarning(message: any, ...args: string[]) {
        if (this.currentLogLevelIsEqualOrSmallerThan(LogLevel.Warn)) {
            if (args.length) {
                console.warn(message, args);
            }
            console.warn(message);
        }
    }

    logDebug(message: any, ...args: string[]) {
        if (this.currentLogLevelIsEqualOrSmallerThan(LogLevel.Debug)) {
            if (args.length) {
                console.log(message, args);
            }
            console.log(message);
        }
    }

    private currentLogLevelIsEqualOrSmallerThan(logLevel: LogLevel) {
        return this.configurationProvider.openIDConfiguration.logLevel <= logLevel;
    }
}
