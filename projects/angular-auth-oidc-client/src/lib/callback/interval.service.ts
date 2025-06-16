import { DOCUMENT, inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IntervalService {
  runTokenValidationRunning: Subscription | null = null;

  private readonly zone = inject(NgZone);
  private readonly document = inject(DOCUMENT);

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
      let intervalId: number | undefined;

      this.zone.runOutsideAngular(() => {
        intervalId = this.document?.defaultView?.setInterval(
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
