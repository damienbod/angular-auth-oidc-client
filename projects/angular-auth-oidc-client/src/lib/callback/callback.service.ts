import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CallbackContext } from '../flows/callback-context';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';

@Injectable({ providedIn: 'root' })
export class CallbackService {
  private stsCallbackInternal$ = new Subject();

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

  handleCallbackAndFireEvents(currentCallbackUrl: string, configId: string): Observable<CallbackContext> {
    let callback$: Observable<any>;

    if (this.flowHelper.isCurrentFlowCodeFlow(configId)) {
      callback$ = this.codeFlowCallbackService.authenticatedCallbackWithCode(currentCallbackUrl, configId);
    } else if (this.flowHelper.isCurrentFlowAnyImplicitFlow(configId)) {
      callback$ = this.implicitFlowCallbackService.authenticatedImplicitFlowCallback(configId);
    }

    return callback$.pipe(tap(() => this.stsCallbackInternal$.next()));
  }
}
