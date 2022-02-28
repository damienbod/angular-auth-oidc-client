import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';

@Injectable({ providedIn: 'root' })
export class CallbackService {
  private stsCallbackInternal$ = new Subject<void>();

  get stsCallback$(): Observable<unknown> {
    return this.stsCallbackInternal$.asObservable();
  }

  constructor(
    private urlService: UrlService,
    private flowHelper: FlowHelper,
    private implicitFlowCallbackService: ImplicitFlowCallbackService,
    private codeFlowCallbackService: CodeFlowCallbackService
  ) {}

  isCallback(currentUrl: string): boolean {
    return this.urlService.isCallbackFromSts(currentUrl);
  }

  handleCallbackAndFireEvents(
    currentCallbackUrl: string,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    let callback$: Observable<any>;

    if (this.flowHelper.isCurrentFlowCodeFlow(config)) {
      callback$ = this.codeFlowCallbackService.authenticatedCallbackWithCode(currentCallbackUrl, config, allConfigs);
    } else if (this.flowHelper.isCurrentFlowAnyImplicitFlow(config)) {
      if (currentCallbackUrl?.includes('#')) {
        let hash = currentCallbackUrl.substring(currentCallbackUrl.indexOf('#') + 1);
        callback$ = this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(config, allConfigs, hash);
      } else {
        callback$ = this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(config, allConfigs);
      }
    }

    return callback$.pipe(tap(() => this.stsCallbackInternal$.next()));
  }
}
