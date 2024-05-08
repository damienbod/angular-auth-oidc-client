import { Injectable, inject } from '@angular/core';
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
  private readonly urlService = inject(UrlService);

  private readonly flowHelper = inject(FlowHelper);

  private readonly implicitFlowCallbackService = inject(
    ImplicitFlowCallbackService
  );

  private readonly codeFlowCallbackService = inject(CodeFlowCallbackService);

  private readonly stsCallbackInternal$ = new Subject<void>();

  get stsCallback$(): Observable<void> {
    return this.stsCallbackInternal$.asObservable();
  }

  isCallback(currentUrl: string, config?: OpenIdConfiguration): boolean {
    if (!currentUrl) {
      return false;
    }

    return this.urlService.isCallbackFromSts(currentUrl, config);
  }

  handleCallbackAndFireEvents(
    currentCallbackUrl: string,
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<CallbackContext> {
    let callback$: Observable<CallbackContext> = new Observable();

    if (this.flowHelper.isCurrentFlowCodeFlow(config)) {
      callback$ = this.codeFlowCallbackService.authenticatedCallbackWithCode(
        currentCallbackUrl,
        config,
        allConfigs
      );
    } else if (this.flowHelper.isCurrentFlowAnyImplicitFlow(config)) {
      if (currentCallbackUrl?.includes('#')) {
        const hash = currentCallbackUrl.substring(
          currentCallbackUrl.indexOf('#') + 1
        );

        callback$ =
          this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(
            config,
            allConfigs,
            hash
          );
      } else {
        callback$ =
          this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(
            config,
            allConfigs
          );
      }
    }

    return callback$.pipe(tap(() => this.stsCallbackInternal$.next()));
  }
}
