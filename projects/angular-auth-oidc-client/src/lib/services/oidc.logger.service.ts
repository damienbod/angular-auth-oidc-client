import { Injectable } from '@angular/core';
import { ConfigurationProvider } from './config.provider';

@Injectable()
export class LoggerService {
    constructor(private configurationProvider: ConfigurationProvider) {}

    logError(message: any, ...args: any[]) {
        console.error(message, ...args);
    }

    logWarning(message: any) {
        if (this.configurationProvider.openIDConfiguration.logConsoleWarningActive) {
            console.warn(message);
        }
    }

    logDebug(message: any) {
        if (this.configurationProvider.openIDConfiguration.logConsoleDebugActive) {
            console.log(message);
        }
    }
}
