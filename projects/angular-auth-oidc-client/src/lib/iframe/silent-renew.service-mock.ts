import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';

@Injectable()
export class SilentRenewServiceMock {
  private refreshSessionWithIFrameCompletedInternal$ = new Subject<CallbackContext>();
  get refreshSessionWithIFrameCompleted$() {
    return this.refreshSessionWithIFrameCompletedInternal$.asObservable();
  }

  getOrCreateIframe(config: OpenIdConfiguration): HTMLIFrameElement {
    return null;
  }

  isSilentRenewConfigured(configuration: OpenIdConfiguration): boolean {
    return null;
  }

  codeFlowCallbackSilentRenewIframe(
    urlParts: any,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    return null;
  }

  silentRenewEventHandler(e: CustomEvent, config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {}
}
