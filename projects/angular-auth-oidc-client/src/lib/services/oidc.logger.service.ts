import { Injectable } from '@angular/core';
import { AuthConfiguration } from '../modules/auth.configuration';

@Injectable()
export class LoggerService {
    constructor(private authConfiguration: AuthConfiguration) {}

    logError(message: any) {
        console.error(message);
    }

    logWarning(message: any) {
        if (this.authConfiguration.isLogLevelWarningEnabled) {
            console.warn(message);
        }
    }

    logDebug(message: any) {
        if (this.authConfiguration.isLogLevelDebugEnabled) {
            console.log(message);
        }
    }
}
