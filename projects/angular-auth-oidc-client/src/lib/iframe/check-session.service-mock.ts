import { BehaviorSubject } from 'rxjs';
import { OpenIdConfiguration } from '../config/openid-configuration';

export class CheckSessionServiceMock {
  private checkSessionChangedInternal$ = new BehaviorSubject<boolean>(false);
  get checkSessionChanged$() {
    return this.checkSessionChangedInternal$.asObservable();
  }

  isCheckSessionConfigured(configuration: OpenIdConfiguration): boolean {
    return null;
  }

  start(configuration: OpenIdConfiguration): void {}

  stop(): void {}

  serverStateChanged(configuration: OpenIdConfiguration): boolean {
    return null;
  }

  getExistingIframe(): HTMLIFrameElement {
    return null;
  }
}
