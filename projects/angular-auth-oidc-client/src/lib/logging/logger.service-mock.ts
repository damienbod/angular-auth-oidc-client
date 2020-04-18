import { Injectable } from '@angular/core';

@Injectable()
export class LoggerServiceMock {
    logError(message: any, ...args: any[]) {
        console.error(message, ...args);
    }

    logWarning(message: any) {
        console.warn(message);
    }

    logDebug(message: any) {
        console.log(message);
    }
}
