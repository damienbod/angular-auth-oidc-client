import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CheckSessionServiceMock {
  private checkSessionChangedInternal$ = new BehaviorSubject<boolean>(false);
  get checkSessionChanged$() {
    return this.checkSessionChangedInternal$.asObservable();
  }

  isCheckSessionConfigured() {
    return false;
  }

  start(): void {}

  stop(): void {}

  serverStateChanged() {
    return false;
  }

  getExistingIframe() {
    return null;
  }
}
