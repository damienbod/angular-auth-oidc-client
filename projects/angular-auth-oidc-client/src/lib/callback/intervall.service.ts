import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IntervallService {
    runTokenValidationRunning: Subscription = null;

    stopPeriodicallTokenCheck(): void {
        if (this.runTokenValidationRunning) {
            this.runTokenValidationRunning.unsubscribe();
            this.runTokenValidationRunning = null;
        }
    }

    startPeriodicTokenCheck(repeatAfterSeconds: number) {
        const millisecondsDelayBetweenTokenCheck = repeatAfterSeconds * 1000;

        return interval(millisecondsDelayBetweenTokenCheck);
    }
}
