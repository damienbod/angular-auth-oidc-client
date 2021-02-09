import { Injectable, NgZone } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

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
    const update$ = new Subject();

    this.zone.runOutsideAngular(() => setInterval(() => this.zone.run(() => update$.next({})), millisecondsDelayBetweenTokenCheck))

    return update$;
  }
}
