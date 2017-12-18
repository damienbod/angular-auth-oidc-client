import { Injectable } from '@angular/core';
import { AuthConfiguration } from '../modules/auth.configuration';

@Injectable()
export class LoggerService {
    constructor(private authConfiguration: AuthConfiguration) {}

    logError(message: any) {
        console.error(message);
    }

    logWarning(message: any) {
        if (this.authConfiguration.log_console_warning_active) {
            console.warn(message);
        }
    }

    logDebug(message: any) {
        if (this.authConfiguration.log_console_debug_active) {
            console.log(message);
        }
    }
}
