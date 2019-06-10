import { Injectable } from '@angular/core';
import { ConfigurationProvider } from './auth-configuration.provider';

@Injectable()
export class LoggerService {
    constructor(private configurationProvider: ConfigurationProvider) {}

    logError(message: any) {
        console.error(message);
    }

    logWarning(message: any) {
        if (this.configurationProvider.openIDConfiguration.log_console_warning_active) {
            console.warn(message);
        }
    }

    logDebug(message: any) {
        if (this.configurationProvider.openIDConfiguration.log_console_debug_active) {
            console.log(message);
        }
    }
}
