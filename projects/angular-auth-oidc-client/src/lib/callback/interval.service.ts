import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IntervalService {
  runTokenValidationRunning = null;

  constructor(private zone: NgZone) {}

  isTokenValidationRunning(): boolean {
    return !!this.runTokenValidationRunning;
  }

  stopPeriodicTokenCheck(): void {
    if (this.runTokenValidationRunning) {
      this.runTokenValidationRunning.unsubscribe();
      this.runTokenValidationRunning = null;
    }
  }

  startPeriodicTokenCheck(repeatAfterSeconds: number): Observable<unknown> {
    const millisecondsDelayBetweenTokenCheck = repeatAfterSeconds * 1000;

    return new Observable((subscriber) => {
      let intervalId;
      this.zone.runOutsideAngular(() => {
        intervalId = setInterval(() => this.zone.run(() => subscriber.next()), millisecondsDelayBetweenTokenCheck);
      });

      return (): void => {
        clearInterval(intervalId);
      };
    });
  }
}
