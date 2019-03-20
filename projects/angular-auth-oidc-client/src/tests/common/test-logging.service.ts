import { Injectable } from '@angular/core';

@Injectable()
export class TestLogging {
    logError(message: any) {
        console.error(message);
    }

    logWarning(message: any) {
        console.warn(message);
    }

    logDebug(message: any) {
        console.log(message);
    }
}
