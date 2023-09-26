import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IntervalService {
  runTokenValidationRunning: Subscription | null = null;

  constructor(private readonly zone: NgZone) {}

  isTokenValidationRunning(): boolean {
    return Boolean(this.runTokenValidationRunning);
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
      let intervalId: NodeJS.Timeout;

      this.zone.runOutsideAngular(() => {
        intervalId = setInterval(
          () => this.zone.run(() => subscriber.next()),
          millisecondsDelayBetweenTokenCheck
        );
      });

      return (): void => {
        clearInterval(intervalId);
      };
    });
  }
}
