import { Injectable } from '@angular/core';

@Injectable()
export class LoggerServiceMock {
    logError(message: any, ...args: any[]) {}

    logWarning(message: any) {}

    logDebug(message: any) {}
}
