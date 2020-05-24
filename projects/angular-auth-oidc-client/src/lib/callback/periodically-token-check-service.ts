import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PeriodicallyTokenCheckService {
    runTokenValidationRunning: Subscription = null;

    stopPeriodicallTokenCheck(): void {
        if (this.runTokenValidationRunning) {
            this.runTokenValidationRunning.unsubscribe();
            this.runTokenValidationRunning = null;
        }
    }
}
