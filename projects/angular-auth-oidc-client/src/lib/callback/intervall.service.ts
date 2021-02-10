import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IntervallService {
  runTokenValidationRunning: Subscription = null;

  constructor(private zone: NgZone) {}

  stopPeriodicallTokenCheck(): void {
    if (this.runTokenValidationRunning) {
      this.runTokenValidationRunning.unsubscribe();
      this.runTokenValidationRunning = null;
    }
  }

  startPeriodicTokenCheck(repeatAfterSeconds: number) {
    const millisecondsDelayBetweenTokenCheck = repeatAfterSeconds * 1000;

    return new Observable((subscriber) => {
      let intervalId;
      this.zone.runOutsideAngular(() => {
        intervalId = setInterval(() => subscriber.next(), millisecondsDelayBetweenTokenCheck);
      });

      return () => {
        clearInterval(intervalId);
      };
    });
  }
}
