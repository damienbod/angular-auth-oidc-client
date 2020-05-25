import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';

@Injectable({ providedIn: 'root' })
export class CallbackService {
    private stsCallbackInternal$ = new Subject();

    get stsCallback$() {
        return this.stsCallbackInternal$.asObservable();
    }

    constructor(
        private urlService: UrlService,
        private flowHelper: FlowHelper,
        private implicitFlowCallbackService: ImplicitFlowCallbackService,
        private codeFlowCallbackService: CodeFlowCallbackService
    ) {}

    isCallback(): boolean {
        return this.urlService.isCallbackFromSts();
    }

    handleCallbackAndFireEvents(currentCallbackUrl: string) {
        let callback$: Observable<any>;

        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            callback$ = this.codeFlowCallbackService.authorizedCallbackWithCode(currentCallbackUrl);
        } else if (this.flowHelper.isCurrentFlowAnyImplicitFlow()) {
            callback$ = this.implicitFlowCallbackService.authorizedImplicitFlowCallback();
        }

        return callback$.pipe(tap(() => this.stsCallbackInternal$.next()));
    }
}
